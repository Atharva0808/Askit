import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { convertToCoreMessages, createDataStreamResponse, streamText, tool } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { listMCPTools, callMCPTool } from "@/lib/mcp/client";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    messages: { id?: string; role: string; content: string | unknown[] }[];
    imageUrl?: string;
    chatId?: string;
    data?: Record<string, unknown>;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages: rawMessages, chatId, data } = body;
  const imageUrl = (data?.imageUrl as string) || body.imageUrl;
  const userMcpServers = (data?.mcpServers as string[]) || [];
  const userPlugins = (data?.plugins as Array<{ id: string, domain: string, name: string, key?: string }>) || [];

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pluginContext = userPlugins.length > 0
    ? `\n\nCONNECTED PLUGINS & API KEYS:\nYou have active connections for: ${userPlugins.map(p => p.name).join(", ")}.
       The system will automatically attempt to inject your browser-stored API keys into MCP tool calls. 
       If a tool asks for a "token" or "apiKey", you can assume the system has provided it from these plugins.`
    : "";

  const systemPrompt = `You are Askit, a helpful AI assistant with access to the user's documents and powerful tools.
${pluginContext}

CAPABILITIES:
- search_documents: Search the user's uploaded documents for relevant context (RAG)
- web_fetch: Fetch and read content from any public URL/website
- web_search: Search the web for current information. Use for recent events, facts, or when the user asks for "search" or "find" or "latest".
- get_datetime: Get the current date and time
- mcp_call: Call tools from custom MCP servers (GitHub, Slack, SQL, etc.)

GUIDELINES:
- Use search_documents when the user asks about their uploaded documents or when you need to ground your answer in their data.
- Use web_fetch when the user asks you to read, summarize, or analyze a web page.
- Use web_search when the user asks for current information, recent news, or to search the web for a topic.
- Use get_datetime when the user needs the current date/time or for any time-sensitive query.
- Use mcp_call whenever the user asks for actions involving external services like GitHub, Slack, or databases, provided an MCP tool is available.
- You can understand images: the user may send an image; describe or answer based on it when relevant.
- You can handle voice input: the user may speak to you; respond naturally.
- Format responses in markdown for readability (use headings, lists, code blocks, bold, etc).
- Be concise and accurate. Cite document chunks when you use them.
- When presenting code, always use fenced code blocks with the language specified.
- IMPORTANT: When you need to use a tool (web_search, search_documents, etc.), use the tool calling functionality provided by the system. NEVER write out a tool call like "<function(...)" or similar as text in your response. Just call the tool.`;

  // Build core messages, stripping inline base64 image markdown so it doesn't
  // confuse the text model. We send the image via the proper multimodal API.
  const coreMessages = convertToCoreMessages(
    rawMessages.map((m) => {
      let c = m.content;
      if (typeof c === "string") {
        c = c.replace(/\n\n!\[Attached\]\(data:image\/[^)]+\)/g, "");
      }
      return { role: m.role, content: c };
    }) as {
      role: "user" | "assistant" | "system";
      content: string;
    }[]
  );

  // Determine if this is a vision request
  const hasImage = !!imageUrl;

  // If an image was attached, inject it into the last user message using the
  // correct multipart content format expected by the AI SDK.
  if (hasImage && coreMessages.length > 0) {
    const last = coreMessages[coreMessages.length - 1];
    if (last.role === "user") {
      const userText =
        (typeof last.content === "string" ? last.content : "") ||
        "Describe this image in detail.";

      // IMPORTANT: `new URL("data:...")` succeeds but many providers reject URL objects for data URLs.
      // So we detect data URLs up front and pass them as plain strings.
      const isDataUrl = imageUrl.startsWith("data:");
      if (isDataUrl) {
        // Convert data URL to base64 + mimeType (most reliable for OpenAI vision).
        const m = /^data:([^;]+);base64,(.+)$/i.exec(imageUrl);
        if (m) {
          const [, mimeType, base64] = m;
          const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
          (last as { content: unknown }).content = [
            { type: "text" as const, text: userText },
            { type: "image" as const, image: bytes, mimeType },
          ];
        } else {
          // Fallback for unexpected data URL formats
          (last as { content: unknown }).content = [
            { type: "text" as const, text: userText },
            { type: "image" as const, image: imageUrl },
          ];
        }
      } else {
        try {
          (last as { content: unknown }).content = [
            { type: "text" as const, text: userText },
            { type: "image" as const, image: new URL(imageUrl) },
          ];
        } catch {
          (last as { content: unknown }).content = [
            { type: "text" as const, text: userText },
            { type: "image" as const, image: imageUrl },
          ];
        }
      }
    }
  }

  // Groq Vision works best with isolated context (no tool history)
  const messagesToSend = hasImage
    ? [coreMessages[coreMessages.length - 1]]
    : coreMessages;

  // Proactive RAG injection: ensures "RAG works" even if the model doesn't tool-call.
  if (!hasImage) {
    const last = coreMessages[coreMessages.length - 1];
    if (last?.role === "user" && typeof last.content === "string") {
      const q = last.content.trim();
      if (q) {
        try {
          const chunks = await retrieveChunks(user.id, q);
          if (chunks.length > 0) {
            const contextBlock = chunks
              .map((c, i) => `[[chunk ${i + 1} | ${c.id}]]\n${c.content}`)
              .join("\n\n");
            messagesToSend.splice(messagesToSend.length - 1, 0, {
              role: "system",
              content:
                "Relevant document context (use this if helpful; cite chunk ids you used):\n\n" +
                contextBlock.slice(0, 4000), // Reduced to 4000 chars to avoid Groq Free Tier TPM Limit crashes
            });
          }
        } catch {
          /* ignore rag errors */
        }
      }
    }
  }

  // Persist the user message to the database
  if (chatId) {
    const lastUser = rawMessages[rawMessages.length - 1];
    if (lastUser?.role === "user") {
      const text =
        typeof lastUser.content === "string"
          ? lastUser.content
          : Array.isArray(lastUser.content)
            ? (lastUser.content as { text?: string }[])
                .filter((p) => (p as { type?: string }).type === "text")
                .map((p) => (p as { text?: string }).text ?? "")
                .join("")
            : "";
      await supabase.from("messages").insert({
        chat_id: chatId,
        role: "user",
        content: text || (hasImage ? "[image]" : "[voice message]"),
      });
      await supabase
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chatId)
        .eq("user_id", user.id);
    }
  }

  // Select free model: Gemini supports vision beautifully, while Groq handles multi-turn RAG/tools aggressively fast natively.
  // Both are 100% free!
  const activeModel = hasImage
    ? (google("gemini-2.5-flash") as any)
    : (groq("llama-3.3-70b-versatile") as any);

  try {
    const mcpToolDefs = await listMCPTools(userMcpServers);
    const mcpToolMap = new Map<
      string,
      { serverUrl: string; toolName: string; description?: string }
    >();
    for (const t of mcpToolDefs) {
      try {
        const host = new URL(t.serverUrl).hostname.replace(/[^a-z0-9]+/gi, "_");
        const key = `mcp_${host}_${t.name}`.toLowerCase();
        mcpToolMap.set(key, {
          serverUrl: t.serverUrl,
          toolName: t.name,
          description: t.description,
        });
      } catch {
        /* ignore */
      }
    }

    const commonOpts = {
      // @ts-ignore: Mismatch between ai v4 and @ai-sdk/google v3 types
      model: activeModel as any,
      messages: messagesToSend,
      onFinish: chatId
        ? async ({ text }: { text: string }) => {
            await supabase.from("messages").insert({
              chat_id: chatId,
              role: "assistant",
              content: text || "",
            });
            const title =
              (
                coreMessages.find((m) => m.role === "user") as
                  | { content?: string }
                  | undefined
              )?.content?.slice(0, 50) ?? "New chat";
            await supabase
              .from("chats")
              .update({ title, updated_at: new Date().toISOString() })
              .eq("id", chatId)
              .eq("user_id", user.id);
          }
        : undefined,
    };

    const result = hasImage
      // @ts-ignore: Mismatch between ai v4 and @ai-sdk/google v3 types
      ? streamText({
          ...commonOpts,
          system:
            "You are Askit, an AI assistant with vision capabilities. Analyze images thoroughly and respond in markdown. Be detailed and helpful.",
          maxSteps: 1,
        })
      // @ts-ignore: Mismatch between ai v4 and @ai-sdk/google v3 types
      : streamText({
          ...commonOpts,
          system: systemPrompt,
          maxSteps: 5,
          tools: {
            search_documents: tool({
              description:
                "Search the user's uploaded documents for relevant context. Use when the user asks about their documents or when you need factual context from their data.",
              parameters: z.object({
                query: z.string().describe("Search query"),
              }),
              execute: async ({ query }) => {
                const chunks = await retrieveChunks(user.id, query);
                return {
                  results: chunks.slice(0, 10).map((c) => ({
                    content: c.content.slice(0, 4000), // Truncate per chunk
                    id: c.id,
                  })),
                };
              },
            }),

            web_search: tool({
              description:
                "Search the web for current information. Use when the user asks for recent events, facts, news, or to find information on the internet.",
              parameters: z.object({
                query: z.string().describe("Search query"),
              }),
              execute: async ({ query }) => {
                try {
                  const encoded = encodeURIComponent(query);
                  // 1. Try HTML search for detailed results (better for news/current events)
                  const htmlRes = await fetch(
                    `https://html.duckduckgo.com/html/?q=${encoded}`,
                    {
                      headers: {
                        "User-Agent":
                          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.9",
                      },
                      cache: "no-store",
                    }
                  );

                  let resultsText = "";

                  if (htmlRes.ok) {
                    const html = await htmlRes.text();
                    const results: string[] = [];
                    // Extract result items (Title, Link, Snippet)
                    const regex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]+?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]+?)<\/a>/g;
                    let m;
                    while ((m = regex.exec(html)) !== null && results.length < 8) {
                      const link = m[1];
                      // Strip tags from title and snippet
                      const title = m[2].replace(/<[^>]+>/g, "").trim();
                      const snippet = m[3].replace(/<[^>]+>/g, "").trim();
                      results.push(`Title: ${title}\nSource: ${link}\nSummary: ${snippet}`);
                    }
                    if (results.length > 0) {
                      resultsText = results.join("\n\n---\n\n");
                    }
                  }

                  // 2. If HTML failed or returned nothing, fallback to simple JSON API
                  if (!resultsText) {
                    const res = await fetch(
                      `https://api.duckduckgo.com/?q=${encoded}&format=json`,
                      { headers: { "User-Agent": "Askit-Bot/1.0" } }
                    );
                    if (res.ok) {
                      const data = (await res.json()) as {
                        AbstractText?: string;
                        Abstract?: string;
                        RelatedTopics?: { Text?: string; FirstURL?: string }[];
                      };
                      const abstract = data.AbstractText || data.Abstract || "";
                      const related = (data.RelatedTopics || [])
                        .slice(0, 5)
                        .map((t) => t.Text || t.FirstURL || "")
                        .filter(Boolean);
                      resultsText = `Direct Answer: ${abstract}\nRelated Information: ${related.join(", ")}`;
                    }
                  }

                  return {
                    query,
                    results: resultsText || "No detailed results found. Try a different query.",
                    source: resultsText ? "Latest Search Data" : "No results"
                  };
                } catch (err) {
                  return {
                    error: err instanceof Error ? err.message : "Web search failed",
                    results: "",
                  };
                }
              },
            }),

            web_fetch: tool({
              description:
                "Fetch and read content from a public URL. Use when the user asks you to read, summarize, or analyze a web page. Returns the text content of the page.",
              parameters: z.object({
                url: z.string().url().describe("The URL to fetch"),
              }),
              execute: async ({ url }) => {
                try {
                  const controller = new AbortController();
                  const timeout = setTimeout(() => controller.abort(), 10000);
                  const res = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                      "User-Agent": "Askit-Bot/1.0",
                      Accept: "text/html,application/xhtml+xml,text/plain",
                    },
                  });
                  clearTimeout(timeout);
                  if (!res.ok) {
                    return {
                      error: `Failed to fetch (${res.status})`,
                      content: null,
                    };
                  }
                  const html = await res.text();
                  const text = html
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                  return { content: text.slice(0, 8000), url };
                } catch (err) {
                  return {
                    error:
                      err instanceof Error
                        ? err.message
                        : "Failed to fetch URL",
                    content: null,
                  };
                }
              },
            }),

            mcp_call: tool({
              description:
                "Call a configured MCP server tool by key. Only works when MCP_SERVERS is set server-side.",
              parameters: z.object({
                toolKey: z
                  .string()
                  .describe("Tool key (mcp_<serverHost>_<toolName>)"),
                args: z.record(z.unknown()).describe("Arguments for the MCP tool"),
              }),
              execute: async ({ toolKey, args }) => {
                const meta = mcpToolMap.get(toolKey.toLowerCase());
                if (!meta) {
                  return {
                    error: `Unknown MCP toolKey. Available keys: ${Array.from(mcpToolMap.keys()).join(", ")}`,
                  };
                }

                // Automorphic Credential Injection:
                // If we have a plugin key matching this tool's origin (e.g. "github"), 
                // inject it into common auth parameters if the AI didn't provide one.
                const toolLower = toolKey.toLowerCase();
                const matchedPlugin = userPlugins.find(p => 
                  toolLower.includes(p.id.toLowerCase()) || 
                  meta.serverUrl.toLowerCase().includes(p.id.toLowerCase())
                );
                
                if (matchedPlugin?.key) {
                   const finalArgs = { ...args } as Record<string, any>;
                   // Inject into common parameter names used by MCP tools
                   const authFields = ["token", "apiKey", "api_key", "password", "access_token"];
                   authFields.forEach(field => {
                      if (!finalArgs[field]) finalArgs[field] = matchedPlugin.key;
                   });
                   const res = await callMCPTool(meta.serverUrl, meta.toolName, finalArgs);
                   const text = (res.content || [])
                     .map((c) => c.text)
                     .filter(Boolean)
                     .join("\n");
                   return { toolKey, result: text.slice(0, 10000) }; // Truncate MCP output
                }

                const res = await callMCPTool(meta.serverUrl, meta.toolName, args);
                const text = (res.content || [])
                  .map((c) => c.text)
                  .filter(Boolean)
                  .join("\n");
                return { toolKey, result: text.slice(0, 10000) || null };
              },
            }),

            get_datetime: tool({
              description:
                "Get the current date and time. Use when the user asks for the current time or date, or for any time-sensitive query.",
              parameters: z.object({}),
              execute: async () => {
                const now = new Date();
                return {
                  iso: now.toISOString(),
                  date: now.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  time: now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  }),
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  unix: Math.floor(now.getTime() / 1000),
                };
              },
            }),
          },
        });

    // Use toDataStreamResponse for compatibility with the ai/react useChat hook
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Askit chat error details:", {
       message: error instanceof Error ? error.message : String(error),
       stack: error instanceof Error ? error.stack : undefined,
       chatId
    });
    
    let message = "An unexpected error occurred. Please try again.";
    if (error instanceof Error) {
      if (
        error.message.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
        error.message.toLowerCase().includes("google") && error.message.toLowerCase().includes("api key")
      ) {
        message = "Missing/invalid Google Gemini API key (GOOGLE_GENERATIVE_AI_API_KEY).";
      } else if (
        error.message.includes("OPENAI_API_KEY") ||
        error.message.toLowerCase().includes("openai") && error.message.toLowerCase().includes("api key")
      ) {
        message = "Missing/invalid OpenAI API key (OPENAI_API_KEY).";
      } else if (
        error.message.includes("GROQ_API_KEY") ||
        error.message.toLowerCase().includes("groq") && error.message.toLowerCase().includes("api key")
      ) {
        message = "Missing/invalid Groq API key (GROQ_API_KEY).";
      } else if (
        error.message.includes("rate limit") ||
        error.message.includes("429") ||
        error.message.includes("Failed after 3 attempt") ||
        error.message.includes("insufficient_quota")
      ) {
        message = "Rate limit or quota reached. Please check your OpenAI/Groq billing or try again later.";
      } else if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
        message = "Failed to connect to an external server or MCP host. Please check your connections.";
      } else if (error.message.includes("model")) {
        message = "The AI model is currently unavailable. Please try again later.";
      } else {
        message = error.message;
      }
    }

    // Return pure Response so NextJS/useChat doesn't swallow/mask the error message
    return new Response(message, { 
      status: 400, 
      headers: { "X-Error": "true" } 
    });
  }
}

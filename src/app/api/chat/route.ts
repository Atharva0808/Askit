import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
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
    return new Response(JSON.stringify({ error: "Unauthorized access. Please log in." }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "X-Error": "true" }
    });
  }

  let body: {
    messages: { id?: string; role: string; content: string | unknown[] }[];
    imageUrl?: string;
    chatId?: string;
    data?: Record<string, unknown>;
    mcpServers?: string[];
    plugins?: Array<{ id: string, domain: string, name: string, key?: string }>;
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
  const userMcpServers = (data?.mcpServers as string[]) || body.mcpServers || [];
  const userPlugins = (data?.plugins as Array<{ id: string, domain: string, name: string, key?: string }>) || body.plugins || [];

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

  let systemPrompt = `You are Askit, a helpful AI assistant with access to the user's documents and powerful tools.
${pluginContext}

CAPABILITIES:
- search_documents: Search the user's uploaded documents for relevant context (RAG)
- web_fetch: Fetch and read content from any public URL/website
- web_search: Search the web for current information. Use for recent events, facts, or when the user asks for "search" or "find" or "latest".
- youtube_api: Search YouTube for videos, channels, and playlists using YouTube Data API.
- github_api: Search repos, list user repos, and read GitHub issues using connected GitHub token.
- spotify_api: Search tracks, artists, and playlists using connected Spotify token.
- get_datetime: Get the current date and time
- mcp_call: Call tools from custom MCP servers (GitHub, Slack, SQL, etc.)

GUIDELINES:
- Use search_documents when the user asks about their uploaded documents or when you need to ground your answer in their data.
- Use web_fetch when the user asks you to read, summarize, or analyze a web page.
- Use web_search when the user asks for current information, recent news, or to search the web for a topic.
- Use youtube_api when the user asks to search YouTube videos, channels, or playlists.
- Use github_api when the user asks to list their GitHub repos, search repositories, or check repository issues.
- Use spotify_api when the user asks to search Spotify songs, artists, or playlists.
- Note: API keys grant access to REST & Data endpoints. Personal account features requiring user browser authorization (e.g. YouTube subscriptions or private user settings) require OAuth2 user login.
- Use get_datetime when the user needs the current date/time or for any time-sensitive query.
- Use mcp_call whenever the user asks for actions involving external services like GitHub, Slack, or databases, provided an MCP tool is available.
- You can understand images: the user may send an image; describe or answer based on it when relevant.
- You can handle voice input: the user may speak to you; respond naturally.
- Format responses in markdown for readability (use headings, lists, code blocks, bold, etc).
- CRITICAL & MANDATORY: After executing any tool (web_search, search_documents, youtube_api, github_api, etc.), you MUST read the tool output and write a complete, clear, detailed markdown response summarizing the findings for the user. NEVER stop or leave an empty response after a tool executes.
- If the user asks about their plugins or API keys, check the "CONNECTED PLUGINS & API KEYS" section above. NEVER claim you don't have access to their system or plugins, because that information is explicitly provided to you in this prompt.
- IMPORTANT: When you need to use a tool (web_search, search_documents, etc.), use the tool calling functionality provided by the system. NEVER write out a tool call like "<function(...)" or similar as text in your response. Just call the tool.`;

  // Build core messages, stripping inline base64 image markdown so it doesn't
  // confuse the text model. We send the image via the proper multimodal API.
  const coreMessages = convertToCoreMessages(
    rawMessages.map((m) => {
      let c = m.content;
      if (typeof c === "string") {
        c = c.replace(/\n\n!\[Attached\]\(data:image\/[^)]+\)/g, "");
      }
      return { ...(m as any), role: m.role as any, content: c };
    }) as any
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

  // Maintain sliding context window (keep last 20 messages to prevent token limits)
  const MAX_HISTORY_MESSAGES = 20;
  const messagesToSend =
    coreMessages.length > MAX_HISTORY_MESSAGES
      ? coreMessages.slice(coreMessages.length - MAX_HISTORY_MESSAGES)
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
            systemPrompt += `\n\n[Internal Context: A proactive document search was run for the user's query. Only use this retrieved text if it is highly relevant to answering the user (cite chunk ids):\n${contextBlock.slice(0, 4000)}]`;
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
      const rawText =
        typeof lastUser.content === "string"
          ? lastUser.content
          : Array.isArray(lastUser.content)
            ? (lastUser.content as { text?: string }[])
                .filter((p) => (p as { type?: string }).type === "text")
                .map((p) => (p as { text?: string }).text ?? "")
                .join("")
            : "";
      const savedContent = rawText || (hasImage ? "[Attached Image]" : "[Voice Message]");
      await supabase.from("messages").insert({
        chat_id: chatId,
        role: "user",
        content: savedContent,
      });
      await supabase
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chatId)
        .eq("user_id", user.id);
    }
  }

  // Select model: Gemini 1.5 Flash for vision, Groq Llama 3.3 70B Versatile for text & tools (with OpenAI gpt-4o-mini fallback).
  const hasGoogleKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  const activeModel = hasImage
    ? (hasGoogleKey ? (google("gemini-1.5-flash") as any) : (openai("gpt-4o-mini") as any))
    : (hasGroqKey ? (groq("llama-3.3-70b-versatile") as any) : (openai("gpt-4o-mini") as any));

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
                  let resultsText = "";

                  // 1. Google News RSS search for news/latest/current queries
                  const isNewsQuery = /news|latest|today|current|updates|headline|breaking/i.test(query);
                  if (isNewsQuery) {
                    try {
                      const newsUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
                      const newsRes = await fetch(newsUrl, {
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
                        cache: "no-store",
                      });
                      if (newsRes.ok) {
                        const xml = await newsRes.text();
                        const items: string[] = [];
                        const regex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g;
                        let m;
                        while ((m = regex.exec(xml)) !== null && items.length < 8) {
                          const title = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
                          const link = m[2].trim();
                          const pubDate = m[3].trim();
                          items.push(`Title: ${title}\nSource: ${link}\nDate: ${pubDate}`);
                        }
                        if (items.length > 0) {
                          resultsText = items.join("\n\n---\n\n");
                        }
                      }
                    } catch { /* fallback */ }
                  }

                  // 2. DuckDuckGo HTML search for general web queries
                  if (!resultsText) {
                    try {
                      const htmlRes = await fetch(
                        `https://html.duckduckgo.com/html/?q=${encoded}`,
                        {
                          headers: {
                            "User-Agent":
                              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                          },
                          cache: "no-store",
                        }
                      );
                      if (htmlRes.ok) {
                        const html = await htmlRes.text();
                        const results: string[] = [];
                        const regex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]+?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]+?)<\/a>/g;
                        let m;
                        while ((m = regex.exec(html)) !== null && results.length < 8) {
                          let link = m[1];
                          if (link.includes("uddg=")) {
                            try {
                              const match = /uddg=([^&]+)/.exec(link);
                              if (match) link = decodeURIComponent(match[1]);
                            } catch { /* ignore */ }
                          } else if (link.startsWith("//")) {
                            link = `https:${link}`;
                          }
                          const title = m[2].replace(/<[^>]+>/g, "").trim();
                          const snippet = m[3].replace(/<[^>]+>/g, "").trim();
                          results.push(`Title: ${title}\nSource: ${link}\nSummary: ${snippet}`);
                        }
                        if (results.length > 0) {
                          resultsText = results.join("\n\n---\n\n");
                        }
                      }
                    } catch { /* fallback */ }
                  }

                  // 3. Wikipedia API Fallback for topic queries
                  if (!resultsText) {
                    try {
                      const wikiRes = await fetch(
                        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&format=json&origin=*`,
                        { headers: { "User-Agent": "Askit-Bot/1.0" } }
                      );
                      if (wikiRes.ok) {
                        const data = await wikiRes.json();
                        const wikiItems = (data.query?.search || []).slice(0, 5).map((item: any) => {
                          const title = item.title;
                          const snippet = (item.snippet || "").replace(/<[^>]+>/g, "");
                          return `Title: ${title}\nSource: https://en.wikipedia.org/wiki/${encodeURIComponent(title)}\nSummary: ${snippet}`;
                        });
                        if (wikiItems.length > 0) {
                          resultsText = wikiItems.join("\n\n---\n\n");
                        }
                      }
                    } catch { /* fallback */ }
                  }

                  return {
                    query,
                    results: resultsText || "Search completed. No direct web snippets available for this query.",
                    source: resultsText ? "Web Search Data" : "No results"
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
                  const cleanHtml = html
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
                    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
                    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
                    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "");
                  const text = cleanHtml
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

            github_api: tool({
              description:
                "Interact with GitHub API. Search repositories, list user repos, or read issue lists. Powered by GitHub Personal Access Token configured in Plugins.",
              parameters: z.object({
                action: z.enum(["list_user_repos", "search_repos", "get_issues"]).describe("GitHub action"),
                query: z.string().optional().describe("Search query or repo name (owner/repo for issues)"),
              }),
              execute: async ({ action, query }) => {
                const ghPlugin = userPlugins.find((p) => p.id.toLowerCase().includes("github"));
                const token = ghPlugin?.key || process.env.GITHUB_TOKEN;
                if (!token) {
                  return { error: "No GitHub Token found. Add your GitHub Personal Access Token in Plugins." };
                }
                const headers = {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/vnd.github+json",
                  "User-Agent": "Askit-AI/1.0",
                };

                try {
                  let endpoint = "https://api.github.com/user/repos?sort=updated&per_page=10";
                  if (action === "search_repos" && query) {
                    endpoint = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=8`;
                  } else if (action === "get_issues" && query) {
                    endpoint = `https://api.github.com/repos/${query}/issues?per_page=10`;
                  }

                  const res = await fetch(endpoint, { headers });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    return { error: err.message || `GitHub API error (${res.status})` };
                  }
                  const data = await res.json();
                  const list = Array.isArray(data) ? data : data.items || [];
                  const results = list.slice(0, 10).map((r: any) => ({
                    name: r.name || r.title,
                    fullName: r.full_name,
                    description: r.description || r.body,
                    url: r.html_url,
                    stars: r.stargazers_count,
                    language: r.language,
                  }));
                  return { action, results };
                } catch (err) {
                  return { error: err instanceof Error ? err.message : "GitHub request failed" };
                }
              },
            }),

            spotify_api: tool({
              description:
                "Search Spotify tracks, artists, and playlists using Spotify Web API. Powered by Spotify API Key/Token configured in Plugins.",
              parameters: z.object({
                query: z.string().describe("Search query (song name, artist, or album)"),
                type: z.enum(["track", "artist", "playlist"]).optional().default("track").describe("Search type"),
              }),
              execute: async ({ query, type }) => {
                const spotifyPlugin = userPlugins.find((p) => p.id.toLowerCase().includes("spotify"));
                const token = spotifyPlugin?.key || process.env.SPOTIFY_API_KEY;
                if (!token) {
                  return { error: "No Spotify Access Token found. Add your token in Plugins." };
                }

                try {
                  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type || "track"}&limit=5`;
                  const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    return { error: err.error?.message || `Spotify API error (${res.status})` };
                  }
                  const data = await res.json();
                  const key = type === "artist" ? "artists" : type === "playlist" ? "playlists" : "tracks";
                  const items = (data[key]?.items || []).map((item: any) => ({
                    name: item.name,
                    artist: item.artists ? item.artists.map((a: any) => a.name).join(", ") : item.owner?.display_name,
                    url: item.external_urls?.spotify,
                    popularity: item.popularity,
                  }));
                  return { results: items };
                } catch (err) {
                  return { error: err instanceof Error ? err.message : "Spotify request failed" };
                }
              },
            }),

            youtube_api: tool({
              description:
                "Search YouTube for videos, channels, and playlists using YouTube Data API. Works with YouTube/Google API Key configured in Plugins or system environment.",
              parameters: z.object({
                query: z.string().describe("Search query or name"),
                type: z.enum(["video", "channel", "playlist"]).optional().default("video").describe("Search type"),
              }),
              execute: async ({ query, type }) => {
                const ytPlugin = userPlugins.find((p) => p.id.toLowerCase().includes("youtube") || p.id.toLowerCase().includes("google"));
                const apiKey = ytPlugin?.key || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.YOUTUBE_API_KEY;
                if (!apiKey) {
                  return { error: "No YouTube API Key found. Add your key in the Plugins tab." };
                }

                try {
                  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=${type || "video"}&maxResults=5&key=${apiKey}`;
                  const res = await fetch(url);
                  if (!res.ok) {
                    const errJson = await res.json().catch(() => ({}));
                    return { error: errJson.error?.message || `YouTube API error (${res.status})` };
                  }
                  const data = await res.json();
                  const results = (data.items || []).map((item: any) => ({
                    title: item.snippet?.title,
                    channelTitle: item.snippet?.channelTitle,
                    description: item.snippet?.description,
                    id: item.id?.videoId || item.id?.channelId || item.id?.playlistId,
                    url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : undefined,
                    publishedAt: item.snippet?.publishedAt,
                  }));
                  return { results };
                } catch (err) {
                  return { error: err instanceof Error ? err.message : "YouTube request failed" };
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
                   const authFields = ["apiKey", "token", "api_key", "access_token", "password"];
                   const existingKey = authFields.find((f) => finalArgs[f]);
                   if (!existingKey) {
                     // Inject into the first matching missing auth field
                     finalArgs["apiKey"] = matchedPlugin.key;
                   }
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
    return result.toDataStreamResponse({
      getErrorMessage: (err) => {
        if (err == null) return "Unknown error during streaming";
        if (typeof err === "string") return err;
        if (err instanceof Error) return err.message;
        return JSON.stringify(err);
      }
    });
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

    // Return JSON Response so NextJS/useChat correctly parses the error message
    return new Response(JSON.stringify({ error: message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", "X-Error": "true" } 
    });
  }
}

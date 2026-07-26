import { createGroq } from "@ai-sdk/groq";
import { streamText, tool } from "ai";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  console.log("Starting test for 'ryan gosling'...");
  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are Askit, a helpful AI assistant with access to the user's documents and powerful tools.
CAPABILITIES:
- search_documents: Search documents
- web_search: Search web
- youtube_api: Search youtube
- spotify_api: Search spotify
- github_api: Search github
- get_datetime: Get date time

GUIDELINES:
- STRICT TOOL ROUTING:
  * ONLY use youtube_api when user EXPLICITLY asks for youtube.
  * ONLY use spotify_api when user EXPLICITLY asks for spotify.
  * ONLY use github_api when user EXPLICITLY asks for github.
  * For general factual, historical, or entity queries, answer directly using your knowledge or use web_search if current live info is needed.
- Format responses in markdown.
- MANDATORY FINAL ANSWER: After invoking any tool, you MUST synthesize the results and write a thorough response.`,
    messages: [{ role: "user", content: "ryan gosling" }],
    maxSteps: 5,
    tools: {
      web_search: tool({
        description: "Search web",
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => `Web results for ${query}`,
      }),
      search_documents: tool({
        description: "Search user documents",
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => `No document matches for ${query}`,
      }),
    },
  });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
  console.log("\n--- END OF STREAM ---");
  const steps = await result.steps;
  console.log("Steps length:", steps.length);
  for (let i = 0; i < steps.length; i++) {
    console.log(`Step ${i}:`, {
      text: steps[i].text,
      toolCalls: steps[i].toolCalls,
      toolResults: steps[i].toolResults,
      finishReason: steps[i].finishReason,
    });
  }
}

main().catch(console.error);

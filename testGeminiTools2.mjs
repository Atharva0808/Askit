import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

async function testGeminiTools() {
  try {
    const res = await generateText({
      model: google('gemini-1.5-flash'),
      messages: [{ role: 'user', content: 'Search for apples' }],
      tools: {
        search_documents: tool({
          description: "Search documents",
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => ({ results: 'Found apples' })
        })
      }
    });
    console.log("SUCCESS:", res.text, res.toolCalls);
  } catch(e) {
    if (e.toJSON) {
      console.log("FAILED JSON:", JSON.stringify(e.toJSON(), null, 2));
    } else {
      console.log("FAILED:", e.message, e.stack);
    }
  }
}
testGeminiTools();

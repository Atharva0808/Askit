import { groq } from '@ai-sdk/groq';
import { generateText, tool } from 'ai';
import { z } from 'zod';

async function testGroqToolsAndText() {
  try {
    const res = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      messages: [{ role: 'user', content: 'Please analyze the attached document.' }],
      tools: {
        search_documents: tool({
          description: "Search documents",
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => ({ results: 'none' })
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
testGroqToolsAndText();

import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';

async function testGroqToolsAndText() {
  try {
    const res = streamText({
      model: groq('llama-3.3-70b-versatile'),
      messages: [{ role: 'user', content: 'Please analyze the attached document.' }],
      maxSteps: 5,
      tools: {
        search_documents: tool({
          description: "Search documents",
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => ({ results: 'none' })
        })
      }
    });
    
    let text = "";
    for await (const chunk of res.textStream) {
      text += chunk;
    }
    console.log("SUCCESS:", text);
  } catch(e) {
    if (e.toJSON) {
      console.log("FAILED JSON:", JSON.stringify(e.toJSON(), null, 2));
    } else {
      console.log("FAILED:", e.message, e.stack);
    }
  }
}
testGroqToolsAndText();

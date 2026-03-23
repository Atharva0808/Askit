import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

async function testGeminiTools() {
  try {
    const res = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [{ role: 'user', content: 'What is the current time?' }],
      tools: {
        get_datetime: tool({
          description: "Get the current time",
          parameters: z.object({}),
          execute: async () => ({ time: '12:00 PM' })
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

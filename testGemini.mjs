import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function testGemini() {
  try {
    const res = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [{ role: 'user', content: 'test' }]
    });
    console.log("SUCCESS:", res.text);
  } catch(e) {
    if (e.toJSON) {
      console.log("FAILED JSON:", JSON.stringify(e.toJSON(), null, 2));
    } else {
      console.log("FAILED:", e.message, e.stack);
    }
  }
}
testGemini();

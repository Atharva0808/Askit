import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

async function testGroqMultipleSystem() {
  try {
    const res = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: "You are a helpful assistant.",
      messages: [
        { role: 'system', content: 'Wait, this is proactive RAG!' },
        { role: 'user', content: 'Hello' }
      ]
    });
    console.log("SUCCESS:", res.text);
  } catch(e) {
    if (e.toJSON) {
      console.log("FAILED JSON:", JSON.stringify(e.toJSON(), null, 2));
    } else {
      console.log("FAILED STR:", e.message, e.stack);
    }
  }
}
testGroqMultipleSystem();

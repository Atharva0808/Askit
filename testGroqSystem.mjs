import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

async function testGroqSystem() {
  try {
    const res = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      messages: [
        { role: 'user', content: 'What is it?' },
        { role: 'system', content: 'Context: Apple.' },
        { role: 'user', content: 'Please analyze the attached document.' }
      ]
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
testGroqSystem();

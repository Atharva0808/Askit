import "dotenv/config";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

async function main() {
  try {
    const res = await generateText({
      model: groq("llama-3.2-11b-vision-preview"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "what is this?" },
            {
              type: "image",
              image: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
                "base64"
              ),
              mimeType: "image/png"
            },
          ],
        },
      ],
    });
    console.log(res.text);
  } catch (e) {
    console.error(e);
  }
}
main();

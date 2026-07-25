import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

export const EMBED_DIM = 1536;

export async function embedText(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: text.replace(/\n/g, " "),
    });
    return embedding;
  } catch (err) {
    console.warn("[RAG] Failed to generate embedding:", err);
    return null;
  }
}

export async function embedChunks(texts: string[]): Promise<(number[] | null)[]> {
  if (!process.env.OPENAI_API_KEY || texts.length === 0) {
    return texts.map(() => null);
  }
  try {
    const cleanTexts = texts.map((t) => t.replace(/\n/g, " "));
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: cleanTexts,
    });
    return embeddings;
  } catch (err) {
    console.warn("[RAG] Batch embedding failed, falling back:", err);
    return texts.map(() => null);
  }
}


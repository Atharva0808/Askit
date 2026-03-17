// Stub embedding utilities for Groq-only setup (no external embedding API).
// We keep the functions so the rest of the RAG pipeline works, but they no-op.

export async function embedText(text: string): Promise<number[]> {
  void text;
  return [];
}

export async function embedChunks(texts: string[]): Promise<number[][]> {
  return texts.map(() => []);
}

export const EMBED_DIM = 0;

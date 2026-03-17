import { createClient } from "@/lib/supabase/server";

const TOP_K = 5;
const MAX_TERMS = 6;

export type RetrievedChunk = {
  id: string;
  content: string;
  document_id: string;
  metadata: Record<string, unknown>;
};

function buildSearchTerms(query: string): string[] {
  const terms = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, " ")
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);

  // Prefer longer terms first, dedupe.
  const uniq = Array.from(new Set(terms)).sort((a, b) => b.length - a.length);
  return uniq.slice(0, MAX_TERMS);
}

export async function retrieveChunks(
  userId: string,
  query: string
): Promise<RetrievedChunk[]> {
  const supabase = await createClient();

  const terms = buildSearchTerms(query);
  const orFilter =
    terms.length > 0
      ? terms.map((t) => `content.ilike.%${t}%`).join(",")
      : `content.ilike.%${query}%`;

  // Text-based retrieval (no embeddings). If FK join isn't configured, fallback below handles it.
  const { data: chunks, error } = await supabase
    .from("chunks")
    .select("id, content, document_id, metadata, documents!inner(user_id)")
    .eq("documents.user_id", userId)
    .or(orFilter)
    .limit(TOP_K);

  if (chunks?.length) {
    return chunks.map((c) => ({
      id: c.id,
      content: c.content,
      document_id: c.document_id,
      metadata: (c.metadata as Record<string, unknown>) ?? {},
    }));
  }

  // If we didn't match chunk content, try matching document names (e.g. "biodata", "resume_example1.pdf").
  if (!error && terms.length > 0) {
    const docOr = terms.map((t) => `name.ilike.%${t}%`).join(",");
    const { data: docsByName } = await supabase
      .from("documents")
      .select("id")
      .eq("user_id", userId)
      .or(docOr)
      .limit(5);

    const docIds = (docsByName || []).map((d) => d.id);
    if (docIds.length > 0) {
      const { data: nameChunks } = await supabase
        .from("chunks")
        .select("id, content, document_id, metadata")
        .in("document_id", docIds)
        .limit(TOP_K);

      if (nameChunks?.length) {
        return nameChunks.map((c) => ({
          id: c.id,
          content: c.content,
          document_id: c.document_id,
          metadata: (c.metadata as Record<string, unknown>) ?? {},
        }));
      }
    }
  }

  if (error) {
    const fallback = await fallbackRetrieve(supabase, userId);
    return fallback;
  }
  return await fallbackRetrieve(supabase, userId);
}

async function fallbackRetrieve(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<RetrievedChunk[]> {
  const { data: docs } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", userId);
  if (!docs?.length) return [];

  const { data: allChunks } = await supabase
    .from("chunks")
    .select("id, content, document_id, metadata")
    .in(
      "document_id",
      docs.map((d) => d.id)
    )
    .limit(TOP_K);

  if (!allChunks?.length) return [];
  return allChunks.map((c) => ({
    id: c.id,
    content: c.content,
    document_id: c.document_id,
    metadata: (c.metadata as Record<string, unknown>) ?? {},
  }));
}

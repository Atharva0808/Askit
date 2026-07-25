import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/rag/embed";

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

  let vectorResults: RetrievedChunk[] = [];
  let keywordResults: RetrievedChunk[] = [];

  // 1. Vector Search
  try {
    const queryEmbedding = await embedText(query);
    if (queryEmbedding && queryEmbedding.length > 0) {
      const { data: vectorChunks, error: rpcErr } = await supabase.rpc(
        "match_chunks",
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.2,
          match_count: 10,
          user_id_filter: userId,
        }
      );

      if (!rpcErr && vectorChunks?.length) {
        vectorResults = vectorChunks.map((c: any) => ({
          id: c.id,
          content: c.content,
          document_id: c.document_id,
          metadata: (c.metadata as Record<string, unknown>) ?? {},
        }));
      }
    }
  } catch (e) {
    console.warn("[RAG] Vector match_chunks query failed:", e);
  }

  // 2. Text Keyword Retrieval
  const terms = buildSearchTerms(query);
  const orFilter =
    terms.length > 0
      ? terms.map((t) => `content.ilike.%${t}%`).join(",")
      : `content.ilike.%${query}%`;

  const { data: textChunks } = await supabase
    .from("chunks")
    .select("id, content, document_id, metadata, documents!inner(user_id)")
    .eq("documents.user_id", userId)
    .or(orFilter)
    .limit(10);

  if (textChunks?.length) {
    keywordResults = textChunks.map((c) => ({
      id: c.id,
      content: c.content,
      document_id: c.document_id,
      metadata: (c.metadata as Record<string, unknown>) ?? {},
    }));
  }

  // 3. Reciprocal Rank Fusion (RRF) Re-ranking
  const RRF_K = 60;
  const scores = new Map<string, { chunk: RetrievedChunk; score: number }>();

  const processList = (list: RetrievedChunk[]) => {
    list.forEach((chunk, rankIndex) => {
      const rank = rankIndex + 1;
      const rrfScore = 1 / (RRF_K + rank);
      const existing = scores.get(chunk.id);
      if (existing) {
        existing.score += rrfScore;
      } else {
        scores.set(chunk.id, { chunk, score: rrfScore });
      }
    });
  };

  processList(vectorResults);
  processList(keywordResults);

  if (scores.size > 0) {
    const sorted = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map((item) => item.chunk);
    return sorted.slice(0, TOP_K);
  }

  // 4. Document Title Match Fallback
  if (terms.length > 0) {
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

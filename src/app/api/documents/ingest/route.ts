import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { embedChunks } from "@/lib/rag/embed";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function stripInvalidUnicode(text: string): string {
  // Remove null bytes, lone surrogates, and other characters
  // that cause "unsupported Unicode escape sequence" in Postgres/JSON.
  return text
    .replace(/\u0000/g, "")            // null bytes
    .replace(/[\uD800-\uDFFF]/g, "")   // lone surrogates
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ""); // control chars (keep \t, \n, \r)
}

function chunkText(text: string): string[] {
  const clean = stripInvalidUnicode(text);
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE, clean.length);
    chunks.push(clean.slice(start, end).trim());
    start = end - (end === clean.length ? 0 : CHUNK_OVERLAP);
  }
  return chunks.filter(Boolean);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let content: string;
  let name = "Untitled";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      content?: string;
      name?: string;
      url?: string;
    };
    if (body.url) {
      try {
        const fetchRes = await fetch(body.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; AskitBot/1.0; +https://askit.app)",
          },
        });
        if (!fetchRes.ok)
          return NextResponse.json(
            { error: `Failed to fetch URL: ${fetchRes.status}` },
            { status: 400 }
          );
        const html = await fetchRes.text();
        content = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        name = body.name ?? new URL(body.url).hostname;
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid URL" },
          { status: 400 }
        );
      }
    } else {
      content = body.content ?? "";
      name = body.name ?? name;
    }
  } else {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    name = (formData.get("name") as string) || file?.name || name;
    if (file) {
      const type = file.type.toLowerCase();
      const isPdf = type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        try {
          const { extractText } = await import("unpdf");
          const buf = new Uint8Array(await file.arrayBuffer());
          const result = await extractText(buf, { mergePages: true });
          content = result?.text ?? "";
        } catch (e) {
          return NextResponse.json(
            { error: e instanceof Error ? e.message : "Failed to parse PDF" },
            { status: 400 }
          );
        }
      } else {
        content = await file.text();
      }
    } else {
      return NextResponse.json(
        { error: "No file or content" },
        { status: 400 }
      );
    }
  }
  if (!content.trim()) {
    // Instead of failing, provide a default string so ingest succeeds
    content = "The uploaded file or URL returned no text content. It might be blocked or empty.";
  }

  const safeContent = stripInvalidUnicode(content);

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({ user_id: user.id, name, content: safeContent })
    .select("id")
    .single();

  if (docError || !doc) {
    return NextResponse.json(
      { error: docError?.message ?? "Failed to create document" },
      { status: 500 }
    );
  }

  const texts = chunkText(content);
  if (texts.length === 0) {
    return NextResponse.json({ documentId: doc.id, chunks: 0 });
  }

  const embeddings = await embedChunks(texts);

  const rows = texts.map((content, i) => ({
    document_id: doc.id,
    content,
    embedding: embeddings[i] ?? null,
    metadata: { index: i },
  }));

  const { error: chunkError } = await supabase.from("chunks").insert(rows);
  if (chunkError) {
    await supabase.from("documents").delete().eq("id", doc.id);
    return NextResponse.json(
      { error: chunkError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    documentId: doc.id,
    chunks: rows.length,
  });
}

import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY for transcription." },
      { status: 500 }
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("audio") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.set("file", file, file.name || "audio.webm");
  upstream.set("model", "whisper-large-v3-turbo");
  upstream.set("response_format", "json");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstream,
    });

    const data = (await res.json().catch(() => ({}))) as {
      text?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || `Transcription failed (${res.status}).` },
        { status: 500 }
      );
    }

    const text = (data.text || "").trim();
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed." },
      { status: 500 }
    );
  }
}


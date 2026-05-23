import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const allGood = Object.values(checks).every(Boolean);

  return NextResponse.json({
    status: allGood ? "ok" : "missing_env_vars",
    checks,
  });
}

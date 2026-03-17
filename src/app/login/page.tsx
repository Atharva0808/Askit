"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function SakuraIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sg_login" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#ec4899" />
        </radialGradient>
      </defs>
      <g transform="translate(32,32)">
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg_login)" opacity="0.9" />
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg_login)" opacity="0.9" transform="rotate(72)" />
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg_login)" opacity="0.9" transform="rotate(144)" />
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg_login)" opacity="0.9" transform="rotate(216)" />
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg_login)" opacity="0.9" transform="rotate(288)" />
        <circle cx="0" cy="0" r="4" fill="#fbbf24" opacity="0.8" />
      </g>
    </svg>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/app";

  const supabase = createClient();

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between px-12 py-10 bg-[#08080a] dot-grid relative">
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-playfair italic font-bold text-neo-pink text-2xl"
          >
            <SakuraIcon className="w-6 h-6" />
            Askit
          </Link>
        </div>

        <div className="relative z-10 pr-8 max-w-md">
          <h2 className="font-playfair italic text-4xl font-bold text-neo-white leading-snug mb-4">
            Your AI assistant,
            <br />
            powered by your data.
          </h2>
          <p className="text-neo-white-muted text-sm leading-relaxed max-w-sm mb-8">
            Upload documents, ask questions with text or images, and get
            accurate, cited answers. Built with RAG, tool-calling, and
            multimodal capabilities.
          </p>

          <div className="flex flex-wrap gap-2">
            {["RAG-powered", "Multimodal", "Agentic AI", "Tool Calling"].map(
              (label) => (
                <span
                  key={label}
                  className="neo-card px-3 py-1.5 text-xs font-medium text-neo-white-muted"
                >
                  {label}
                </span>
              )
            )}
          </div>
        </div>

        <div className="h-6" />
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 bg-neo-black">
        <div className="w-full max-w-md">
          {/* Mobile-only back link */}
          <Link
            href="/"
            className="lg:hidden neo-btn neo-btn-ghost text-neo-pink font-playfair italic font-semibold text-lg inline-flex mb-8 items-center gap-2"
          >
            <SakuraIcon className="w-5 h-5" />
            Askit
          </Link>

          <h1 className="font-playfair italic text-3xl font-bold text-neo-white mb-1">
            Welcome back
          </h1>
          <p className="text-neo-white-muted text-sm mb-8">
            Sign in to continue to Askit.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm neo-fade-in">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-5 p-3 rounded-lg bg-neo-pink/8 border border-neo-pink/15 text-neo-pink text-sm neo-fade-in">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="neo-btn w-full py-3 mb-8"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-neo-black px-3 text-neo-white-muted/60">
                or with email
              </span>
            </div>
          </div>

          <form onSubmit={signInWithEmail} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-neo-white-muted mb-1.5 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neo-input w-full px-4 py-3 text-sm text-neo-white placeholder-neo-white-muted/40"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-neo-white-muted mb-1.5 uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neo-input w-full px-4 py-3 text-sm text-neo-white placeholder-neo-white-muted/40"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="neo-btn neo-btn-primary w-full py-3"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-neo-white-muted text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-neo-pink hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neo-black flex items-center justify-center text-neo-white-muted">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

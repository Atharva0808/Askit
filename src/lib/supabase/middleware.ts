import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse; // Skip auth check if keys are missing
  }

  // ── Classify route BEFORE any auth call ──
  const isLanding = request.nextUrl.pathname === "/";
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");
  const isAuthPage =
    request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";

  // Auth callback: pass through immediately (no auth check needed)
  if (isAuthCallback) {
    return supabaseResponse;
  }

  // Public pages (landing, login, signup): check for existing session cookie first.
  // If no session cookies exist, skip the expensive getUser() call entirely — the
  // user is definitely not logged in, so there's nothing to redirect.
  const hasSessionCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  if ((isLanding || isAuthPage) && !hasSessionCookie) {
    return supabaseResponse; // Fast path: no auth cookies → render page instantly
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Shorter timeout for public pages (just checking if logged-in user should be
  // redirected to /app), longer for protected pages where auth is mandatory.
  const timeoutMs = (isLanding || isAuthPage) ? 3000 : 5000;

  const {
    data: { user },
  } = (await Promise.race([
    supabase.auth.getUser(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), timeoutMs)),
  ]).catch((err) => {
    console.error("[Auth] Session update timeout or error:", err);
    return { data: { user: null } };
  })) as { data: { user: any } };

  if (user) {
    if (isLanding || isAuthPage) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
    return supabaseResponse;
  }

  if (!isLanding && !isAuthPage) {
    const redirectTo = new URL("/", request.url);
    redirectTo.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectTo);
  }

  return supabaseResponse;
}

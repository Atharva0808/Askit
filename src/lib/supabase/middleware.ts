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

  // Add a timeout to auth check to prevent long hangs if Supabase is unreachable
  const {
    data: { user },
  } = (await Promise.race([
    supabase.auth.getUser(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 10000)),
  ]).catch((err) => {
    console.error("[Auth] Session update timeout or error:", err);
    return { data: { user: null } };
  })) as { data: { user: any } };

  const isLanding = request.nextUrl.pathname === "/";
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");
  const isAuthPage =
    request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";

  if (isAuthCallback) {
    return supabaseResponse;
  }

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

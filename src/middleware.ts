import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (Service Worker)
     * - Error pages (e.g. /404, /500)
     * - All files in the public folder with common extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)",
  ],
};

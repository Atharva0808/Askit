"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

function IconIngest() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  );
}

function IconPuzzle() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.439 7.85A2.002 2.002 0 0 0 18 6h-3a2 2 0 0 1-4 0h-3a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h3a2 2 0 0 1 4 0h3a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4Z" />
    </svg>
  );
}

function IconServer() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
    </svg>
  );
}

export function AppHeader({ user }: { user: User }) {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/app/documents", label: "Ingest", Icon: IconIngest },
    { href: "/app/plugins", label: "Plugins", Icon: IconPuzzle },
    { href: "/app/mcp", label: "MCP", Icon: IconServer },
  ];

  return (
    <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 sm:px-4">
      <header className="h-10 sm:h-12 w-full rounded-xl sm:rounded-2xl border border-white/[0.06] flex items-center justify-between px-3 sm:px-6 bg-neo-black/80 backdrop-blur-xl shadow-2xl">
        <h1 className="text-xs sm:text-sm font-medium text-white/60 truncate">
          {user.user_metadata?.full_name
            ? `Hi, ${user.user_metadata.full_name.split(" ")[0]}`
            : "Askit"}
        </h1>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium transition-all duration-75 active:scale-95 touch-manipulation ${
                pathname === href
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04] active:bg-white/[0.08]"
              }`}
              title={label}
            >
              <Icon />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </header>
    </div>
  );
}

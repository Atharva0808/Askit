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
      <header className="h-11 sm:h-12 w-full rounded-xl border border-zinc-800/80 flex items-center justify-between px-3.5 sm:px-5 bg-zinc-950/90 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2.5 truncate">
          <span className="text-xs sm:text-sm font-semibold text-zinc-100 font-sans tracking-tight truncate">
            {user.user_metadata?.full_name
              ? `Hi, ${user.user_metadata.full_name.split(" ")[0]}`
              : "Askit"}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
            Llama 3.3
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 touch-manipulation ${
                pathname === href
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
              }`}
              title={label}
            >
              <Icon />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </header>
    </div>
  );
}

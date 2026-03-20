"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Chat = { id: string; title: string; updated_at: string };
type Doc = { id: string; name: string; created_at: string };

/* ─── Minimal Icons ─── */
function IconPlus() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function IconPanelLeftClose() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 3v18M15 15l-3-3 3-3" />
    </svg>
  );
}

export function AppSidebar({
  user,
  chats,
  documents,
}: {
  user: User;
  chats: Chat[];
  documents: Doc[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentChatId = searchParams.get("chatId");
  const supabase = createClient();

  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const filteredChats = chats.filter((chat) =>
    (chat.title || "New chat")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function deleteChat(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (currentChatId === id) router.push("/app");
        router.refresh();
      }
    } catch {
      /* noop */
    }
  }

  async function deleteDocument(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch {
      /* noop */
    }
  }

  function startRenameChat(e: React.MouseEvent, chat: Chat) {
    e.preventDefault();
    e.stopPropagation();
    setRenamingDocId(null);
    setRenamingChatId(chat.id);
    setRenameValue(chat.title || "New chat");
  }

  async function finishRenameChat() {
    const id = renamingChatId;
    const value = renameValue.trim();
    if (!id) return;
    setRenamingChatId(null);
    if (!value) return;
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value }),
      });
      if (res.ok) router.refresh();
    } catch {
      /* noop */
    }
  }

  function startRenameDoc(doc: Doc) {
    setRenamingChatId(null);
    setRenamingDocId(doc.id);
    setRenameValue(doc.name);
  }

  async function finishRenameDoc() {
    const id = renamingDocId;
    const value = renameValue.trim();
    if (!id) return;
    setRenamingDocId(null);
    if (!value) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      if (res.ok) router.refresh();
    } catch {
      /* noop */
    }
  }

  // Collapsed sidebar
  if (!isOpen) {
    return (
      <>
        {/* Mobile: floating toggle */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-[#111113]/90 border border-white/[0.06] text-white/60 hover:text-white hover:bg-[#111113] transition-colors duration-75 shadow-2xl backdrop-blur-xl"
          title="Open sidebar"
        >
          <IconMenu />
        </button>
        {/* Desktop: slim rail */}
        <aside className="hidden lg:flex w-[52px] shrink-0 border-r border-white/[0.04] flex-col items-center bg-[#0a0a0c] py-5 h-full">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors duration-75"
            title="Expand sidebar"
          >
            <IconMenu />
          </button>
        </aside>
      </>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onClick={() => setIsOpen(false)}
      />

      <aside className="fixed lg:relative z-50 lg:z-auto w-[280px] lg:w-[260px] shrink-0 border-r border-white/[0.04] flex flex-col bg-[#0a0a0c] overflow-hidden h-full shadow-2xl lg:shadow-none">
        {/* ── Brand & Toggle ── */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <Link
            href="/app"
            className="flex items-center gap-2.5 group"
          >
            <svg className="w-8 h-8 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><radialGradient id="sbsg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f9a8d4"/><stop offset="100%" stopColor="#ec4899"/></radialGradient></defs>
              <g transform="translate(32,32)"><ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sbsg)" opacity="0.9"/><ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sbsg)" opacity="0.9" transform="rotate(60)"/><ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sbsg)" opacity="0.9" transform="rotate(120)"/><ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sbsg)" opacity="0.9" transform="rotate(180)"/><ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sbsg)" opacity="0.9" transform="rotate(240)"/><ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sbsg)" opacity="0.9" transform="rotate(300)"/><circle cx="0" cy="0" r="4" fill="#fbbf24" opacity="0.8"/></g>
            </svg>
            <span
              className="text-lg tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, color: "var(--neo-pink)" }}
            >
              Askit
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors duration-75"
            title="Close sidebar"
          >
            <IconPanelLeftClose />
          </button>
        </div>

        {/* ── New Chat Button ── */}
        <div className="px-3 pb-2">
          <Link
            href="/app"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-white/[0.06] to-white/[0.03] hover:from-white/[0.10] hover:to-white/[0.06] border border-white/[0.06] hover:border-white/[0.10] text-neo-white text-sm font-medium transition-colors duration-75 w-full group touch-manipulation"
          >
            <IconPlus />
            <span>New chat</span>
          </Link>
        </div>

        {/* ── Search ── */}
        <div className="px-3 pb-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20">
              <IconSearch />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-2 text-xs text-neo-white placeholder-white/20 bg-white/[0.02] border border-white/[0.04] outline-none focus:border-white/[0.10] transition-colors rounded-lg"
            />
          </div>
        </div>

        {/* ── Chat History ── */}
        <nav className="px-2 flex-1 overflow-hidden min-h-0 flex flex-col gap-2 py-2">
          {/* Chats */}
          <div className="flex flex-col min-h-0 flex-[6]">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 mb-1.5">Recent</p>
            <div className="space-y-0.5 overflow-y-auto flex-1 pr-1">
              {filteredChats.length === 0 && !searchQuery && (
                <p className="text-[11px] text-white/15 px-3 py-3 text-center">No chats yet</p>
              )}
              {filteredChats.map((chat) => {
                const isRenaming = renamingChatId === chat.id;
                const isActive = currentChatId === chat.id;
                return (
                  <Link
                    key={chat.id}
                    href={`/app?chatId=${chat.id}`}
                    className={`flex items-center group gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors duration-75 touch-manipulation ${
                      isActive
                        ? "bg-white/[0.08] text-white border border-white/[0.06]"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    <IconMessage />
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={finishRenameChat}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); finishRenameChat(); }
                          else if (e.key === "Escape") setRenamingChatId(null);
                        }}
                        className="bg-transparent border-none outline-none flex-1 min-w-0 text-xs text-neo-white"
                        onClick={(e) => e.preventDefault()}
                      />
                    ) : (
                      <span className="truncate flex-1 min-w-0">
                        {chat.title || "New chat"}
                      </span>
                    )}
                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        type="button"
                        onClick={(e) => startRenameChat(e, chat)}
                        className="p-1 rounded hover:bg-white/[0.08] text-white/30 hover:text-white transition-colors"
                        aria-label="Rename"
                      >
                        <IconPencil />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => deleteChat(e, chat.id)}
                        className="p-1 rounded hover:bg-white/[0.08] text-white/30 hover:text-red-400 transition-colors"
                        aria-label="Delete"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </Link>
                );
              })}
              {searchQuery && filteredChats.length === 0 && (
                <p className="text-[11px] text-white/20 px-3 py-2">No chats found</p>
              )}
            </div>
          </div>

          {/* Documents (Knowledge) */}
          {documents.length > 0 && (
            <div className="flex flex-col min-h-0 flex-[4] border-t border-white/[0.04] pt-3">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 mb-1.5">Knowledge</p>
              <div className="space-y-0.5 overflow-y-auto flex-1 pr-1">
                {documents.map((doc) => {
                  const isRenaming = renamingDocId === doc.id;
                  return (
                    <div key={doc.id} className="flex items-center group gap-2 px-3 py-1.5 rounded-lg text-[12px] text-white/35 hover:text-white/60 hover:bg-white/[0.02] transition-all duration-150 cursor-default">
                      <IconDoc />
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={finishRenameDoc}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); finishRenameDoc(); }
                            else if (e.key === "Escape") setRenamingDocId(null);
                          }}
                          className="bg-transparent border-none outline-none flex-1 min-w-0 text-xs text-neo-white"
                        />
                      ) : (
                        <span className="truncate flex-1 min-w-0">{doc.name}</span>
                      )}
                      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button type="button" onClick={() => startRenameDoc(doc)} className="p-0.5 rounded hover:bg-white/[0.08] text-white/25 hover:text-white transition-colors" aria-label={`Rename ${doc.name}`}>
                          <IconPencil />
                        </button>
                        <button type="button" onClick={(e) => deleteDocument(e, doc.id)} className="p-0.5 rounded hover:bg-white/[0.08] text-white/25 hover:text-red-400 transition-colors" aria-label={`Delete ${doc.name}`}>
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* ── User Panel ── */}
        <div className="p-3 border-t border-white/[0.04]">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-2.5">
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center text-pink-400 text-sm font-semibold shrink-0">
                {(user.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/80 truncate">
                {user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User"}
              </p>
              <p className="text-[10px] text-white/25 truncate">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              title="Sign out"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

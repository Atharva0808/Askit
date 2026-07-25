"use client";

import { useState, useEffect } from "react";

export default function MCPPage() {
  const [mcpUrls, setMcpUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const list = JSON.parse(localStorage.getItem("askit_mcp_servers") || "[]") as string[];
      setMcpUrls(Array.isArray(list) ? list : []);
    } catch {
      setMcpUrls([]);
    }
  }, []);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const url = newUrl.trim();
    if (!url) return;
    const next = [...mcpUrls.filter((u) => u !== url), url];
    setMcpUrls(next);
    setNewUrl("");
    try {
      localStorage.setItem("askit_mcp_servers", JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(false);
    }
  }

  function handleRemove(url: string) {
    const next = mcpUrls.filter((u) => u !== url);
    setMcpUrls(next);
    try {
      localStorage.setItem("askit_mcp_servers", JSON.stringify(next));
    } catch {
      /* noop */
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 pt-20 sm:pt-24">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 font-sans">
          MCP Servers
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          Connect Model Context Protocol servers to extend the AI with custom tools.
        </p>
      </div>

      {/* Add server form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-white-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
          </svg>
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://your-mcp-server.com"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neo-white placeholder-neo-white-muted/30 text-sm outline-none focus:border-white/[0.12] transition-colors"
          />
        </div>
        <button
          type="submit"
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-white/[0.06] border border-white/[0.08] text-neo-white hover:bg-white/[0.1]"
          }`}
        >
          {saved ? "✓ Added" : "Add"}
        </button>
      </form>

      {/* Info box */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-6">
        <h3 className="text-sm font-medium text-neo-white mb-2">How MCP works</h3>
        <p className="text-xs text-neo-white-muted/50 leading-relaxed">
          MCP (Model Context Protocol) servers expose tools that the AI agent can call during conversations. 
          Add your server URLs above, and the agent will automatically discover and use available tools 
          like web search, code execution, database queries, and more.
        </p>
      </div>

      {/* Server list */}
      {mcpUrls.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neo-white-muted/30 mb-3">
            Connected servers ({mcpUrls.length})
          </p>
          <div className="space-y-2">
            {mcpUrls.map((url) => (
              <div
                key={url}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group hover:border-white/[0.08] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-sm text-neo-white truncate">{url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="shrink-0 text-xs text-neo-white-muted/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded-lg hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-neo-white-muted/30 text-sm">
          No MCP servers connected yet.
        </div>
      )}
    </div>
  );
}

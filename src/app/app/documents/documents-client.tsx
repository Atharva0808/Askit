"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Doc = { id: string; name: string; created_at: string };

function DocIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isUrl = /^https?:\/\//i.test(name) || name.startsWith("http");
  if (isUrl || ext === "html" || ext === "url") {
    return (
      <svg className="h-4 w-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  }
  if (ext === "pdf") {
    return (
      <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8M10 9H8" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export function DocumentsClient({
  initialDocuments,
}: {
  initialDocuments: Doc[];
}) {
  const [documents, setDocuments] = useState<Doc[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showIngested, setShowIngested] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  function showSuccess(msg: string) {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setSuccessMsg(msg);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMsg(null);
      successTimeoutRef.current = null;
    }, 4000);
  }

  async function handleFile(file: File) {
    if (!file) return;
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("name", file.name);
    try {
      const res = await fetch("/api/documents/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDocuments((prev) => [{
        id: data.documentId,
        name: file.name,
        created_at: new Date().toISOString(),
      }, ...prev]);
      showSuccess(`"${file.name}" ingested successfully with ${data.chunks || 0} chunks`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  async function handleUrlIngest() {
    const url = urlInput.trim();
    if (!url) return;
    setError(null);
    setUploading(true);
    try {
      let hostname = url;
      try { hostname = new URL(url).hostname; } catch { /* ignore */ }
      const res = await fetch("/api/documents/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, name: hostname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to ingest URL");
      setDocuments((prev) => [{
        id: data.documentId,
        name: hostname,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setUrlInput("");
      showSuccess(`"${hostname}" ingested successfully with ${data.chunks || 0} chunks`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ingest URL");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function deleteDocument(id: string) {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        router.refresh();
      }
    } catch { /* noop */ }
  }

  return (
    <div className="space-y-4">
      {/* Compact Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed px-4 py-5 sm:px-5 sm:py-6 text-center cursor-pointer transition-all duration-300 active:scale-[0.99] touch-manipulation ${
          dragOver
            ? "border-pink-500/40 bg-pink-500/5 scale-[1.01]"
            : uploading
              ? "border-pink-500/30 bg-pink-500/5"
              : "border-white/[0.08] bg-white/[0.01] hover:border-white/[0.15] hover:bg-white/[0.03]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json,.pdf,application/pdf,.py,.js,.ts,.html,.css,.csv"
          onChange={handleFileInput}
          disabled={uploading}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            uploading ? "bg-pink-500/10" : "bg-white/[0.04]"
          }`}>
            {uploading ? (
              <svg className="w-5 h-5 text-pink-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-neo-white">
              {uploading ? "Processing..." : "Drop a file or click to browse"}
            </p>
            <p className="text-[11px] text-white/25">
              PDF, TXT, Markdown, JSON, Code
            </p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleUrlIngest(); }}
            placeholder="Paste a URL to ingest..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-neo-white placeholder-white/20 text-sm outline-none focus:border-white/[0.12] transition-colors"
            disabled={uploading}
          />
        </div>
        <button
          type="button"
          onClick={handleUrlIngest}
          disabled={uploading || !urlInput.trim()}
          className="px-4 sm:px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-neo-white text-sm font-medium hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97] touch-manipulation"
        >
          {uploading ? "..." : "Ingest"}
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs sm:text-sm neo-fade-in">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="shrink-0 p-1 rounded hover:bg-red-500/20 transition-colors">x</button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm neo-fade-in">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {successMsg}
        </div>
      )}

      {/* Document list - compact, no green icons */}
      {documents.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowIngested((v) => !v)}
            className="w-full flex items-center justify-between text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 mb-2 hover:text-white/30 transition-colors"
          >
            <span>Ingested ({documents.length})</span>
            <span className="text-[10px] text-white/15">{showIngested ? "Hide" : "Show"}</span>
          </button>
          {showIngested && (
            <div className="space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] group hover:border-white/[0.08] transition-all duration-200"
                >
                  <DocIcon name={doc.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-white/60 truncate">{doc.name}</p>
                  </div>
                  <span className="text-[10px] text-white/15 hidden sm:block">
                    {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteDocument(doc.id)}
                    className="shrink-0 p-1 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Remove"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

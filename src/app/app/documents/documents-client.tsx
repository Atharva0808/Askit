"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";





export function DocumentsClient() {

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
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



  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Sleek File Upload Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`px-5 py-8 sm:py-10 text-center cursor-pointer transition-all duration-500 relative group overflow-hidden ${
            dragOver ? "bg-white/[0.06]" : "bg-transparent hover:bg-white/[0.03]"
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
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${
              uploading ? "bg-white/[0.08]" : "bg-white/[0.04] group-hover:scale-110 group-hover:bg-white/[0.08]"
            }`}>
              {uploading ? (
                <svg className="w-5 h-5 text-white/40 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-60" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-[15px] font-medium text-neo-white/90 tracking-tight">
                {uploading ? "Analyzing document..." : "Drop a file or click to browse"}
              </p>
              <p className="text-xs text-white/20 tracking-wide font-light">
                PDF, TXT, Markdown, Coding files
              </p>
            </div>
          </div>
          
          {/* Subtle animated border glow on hover */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        {/* Integrated URL Section */}
        <div className="border-t border-white/[0.06] bg-white/[0.01] p-1.5 flex gap-1.5">
          <div className="flex-1 relative">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUrlIngest(); }}
              placeholder="Paste link to ingest..."
              className="w-full bg-transparent pl-4 pr-3 py-2.5 text-[13px] text-neo-white placeholder-white/20 outline-none transition-all"
              disabled={uploading}
            />
          </div>
          <button
            type="button"
            onClick={handleUrlIngest}
            disabled={uploading || !urlInput.trim()}
            className="px-5 py-2 rounded-xl bg-white/[0.04] text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {uploading ? "..." : "Ingest"}
          </button>
        </div>
      </div>

      {/* Elegant Status overlays */}
      <div className="space-y-2">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-400/5 border border-red-400/10 text-red-300 text-[12px] flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="flex-1 leading-relaxed">{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-white/20 hover:text-white transition-colors text-lg leading-none">&times;</button>
          </div>
        )}
        {successMsg && (
          <div className="px-4 py-3 rounded-xl bg-emerald-400/5 border border-emerald-400/10 text-emerald-300 text-[12px] flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300 font-medium">
            <svg className="w-4 h-4 mt-0.5 shrink-0 underline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="flex-1 leading-relaxed">{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

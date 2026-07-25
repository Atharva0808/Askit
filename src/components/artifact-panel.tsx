"use client";

import { useState } from "react";

export type ArtifactData = {
  title: string;
  type: "html" | "svg" | "code" | "markdown";
  content: string;
  language?: string;
};

type Props = {
  artifact: ArtifactData | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ArtifactPanel({ artifact, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !artifact) return null;

  async function handleCopy() {
    if (!artifact) return;
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const isPreviewable = artifact.type === "html" || artifact.type === "svg";

  return (
    <div
      className={`transition-all duration-300 z-30 flex flex-col bg-[#111114] border-l border-zinc-800 shadow-2xl ${
        isFullscreen
          ? "fixed inset-0 z-50 w-full h-full"
          : "w-full lg:w-[480px] xl:w-[560px] h-full"
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-100 truncate">
            {artifact.title || "Artifact Canvas"}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 uppercase tracking-wider font-mono border border-zinc-700/50">
            {artifact.language || artifact.type}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tab Switcher for previewable content */}
          {isPreviewable && (
            <div className="flex rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.06] mr-2">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === "preview"
                    ? "bg-white/[0.12] text-neo-white shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === "code"
                    ? "bg-white/[0.12] text-neo-white shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                Code
              </button>
            </div>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Copy content"
          >
            {copied ? (
              <span className="text-xs text-emerald-400 font-medium">Copied!</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isFullscreen ? "M9 9L4 4m0 0l5 0m-5 0l0 5m6 6l5 5m0 0l-5 0m5 0l0-5" : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"} />
            </svg>
          </button>

          {/* Close Panel */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Panel Body Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#0a0a0c] relative">
        {isPreviewable && activeTab === "preview" ? (
          artifact.type === "svg" ? (
            <div
              className="w-full h-full flex items-center justify-center p-6 bg-white/[0.01] rounded-xl border border-white/[0.04]"
              dangerouslySetInnerHTML={{ __html: artifact.content }}
            />
          ) : (
            <iframe
              title={artifact.title}
              srcDoc={artifact.content}
              className="w-full h-full min-h-[400px] border-0 rounded-xl bg-white"
              sandbox="allow-scripts allow-modals"
            />
          )
        ) : (
          <pre className="text-xs font-mono text-white/80 whitespace-pre-wrap break-all leading-relaxed font-normal">
            {artifact.content}
          </pre>
        )}
      </div>
    </div>
  );
}

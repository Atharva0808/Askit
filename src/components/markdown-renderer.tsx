"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, type ReactNode } from "react";
import type { ArtifactData } from "./artifact-panel";

function CopyCodeButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <button onClick={handleCopy} className="code-block-copy" type="button">
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function MarkdownRenderer({
  content,
  onOpenArtifact,
}: {
  content: string;
  onOpenArtifact?: (artifact: ArtifactData) => void;
}) {
  // Defensive: Strip leaked function tags from model outputs
  const cleanedContent = content.replace(/<function[\s\S]*?<\/function>/gi, "").trim();

  if (!cleanedContent) return null;

  return (
    <div className="md-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");

            if (match) {
              const lang = match[1].toLowerCase();
              const isCanvasType = ["html", "svg", "jsx", "tsx", "js", "ts", "python", "css"].includes(lang);

              return (
                <div className="code-block-wrap my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c0e]">
                  <div className="code-block-header flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800">
                    <span className="code-block-lang text-[11px] font-mono font-medium text-zinc-300 uppercase tracking-wider">
                      {lang}
                    </span>
                    <div className="flex items-center gap-2">
                      {isCanvasType && onOpenArtifact && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenArtifact({
                              title: `${lang.toUpperCase()} Artifact`,
                              type: lang === "html" ? "html" : lang === "svg" ? "svg" : "code",
                              content: text,
                              language: lang,
                            })
                          }
                          className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 transition-all font-medium flex items-center gap-1"
                        >
                          <span>⚡ Canvas</span>
                        </button>
                      )}
                      <CopyCodeButton text={text} />
                    </div>
                  </div>
                  <pre className="code-block-pre p-3 overflow-x-auto text-xs font-mono leading-relaxed text-zinc-200">
                    <code
                      className={`code-block-code ${className || ""}`}
                      {...(rest as React.HTMLAttributes<HTMLElement>)}
                    >
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className={`px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-xs border border-zinc-700/50 ${className || ""}`}
                {...(rest as React.HTMLAttributes<HTMLElement>)}
              >
                {children}
              </code>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-200 underline underline-offset-4 hover:text-white transition-colors font-medium"
                {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
              >
                {children as ReactNode}
              </a>
            );
          },
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
}

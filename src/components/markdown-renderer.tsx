"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, type ReactNode } from "react";

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

export function MarkdownRenderer({ content }: { content: string }) {
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
              return (
                <div className="code-block-wrap">
                  <div className="code-block-header">
                    <span className="code-block-lang">{match[1]}</span>
                    <CopyCodeButton text={text} />
                  </div>
                  <pre className="code-block-pre">
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
                className={className}
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

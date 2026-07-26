"use client";

import { useChat } from "ai/react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MarkdownRenderer } from "./markdown-renderer";
import { ArtifactPanel, type ArtifactData } from "./artifact-panel";

import type { Message } from "ai";

type UIMessage = Message & {
  toolInvocations?: Array<{ toolCallId: string; toolName: string; state: string; args?: any; result?: any }>;
};

/* --- Interactive Tool Execution Card --- */
function ToolInvocationCard({ tool }: { tool: any }) {
  const [expanded, setExpanded] = useState(false);
  const isDone = tool.state === "result" || tool.state === "output" || tool.result !== undefined;

  const getToolMeta = (name: string) => {
    switch (name) {
      case "web_search":
        return { label: "Web Search", color: "text-zinc-200" };
      case "search_documents":
        return { label: "Document RAG", color: "text-zinc-200" };
      case "web_fetch":
        return { label: "Page Fetch", color: "text-zinc-200" };
      case "mcp_call":
        return { label: "MCP Tool", color: "text-zinc-300" };
      case "get_datetime":
        return { label: "Time Lookup", color: "text-zinc-300" };
      default:
        return { label: name, color: "text-zinc-400" };
    }
  };

  const meta = getToolMeta(tool.toolName);

  return (
    <div className="my-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden text-xs transition-all shadow-sm">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          <span className={`font-medium text-xs ${meta.color}`}>{meta.label}</span>
          <span className="text-zinc-500 truncate max-w-[220px] font-mono text-[11px]">
            {tool.args ? JSON.stringify(tool.args).slice(0, 45) : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDone ? (
            <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Done
            </span>
          ) : (
            <span className="flex items-center gap-1 text-zinc-300 text-[11px] font-medium bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" /> Running...
            </span>
          )}
          <span className="text-zinc-500 text-[10px]">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="p-3 border-t border-white/[0.06] bg-black/40 font-mono text-[11px] space-y-2 text-white/80 neo-fade-in">
          {tool.args && (
            <div>
              <span className="text-white/40 block mb-0.5 font-sans text-[10px] uppercase tracking-wider">Parameters:</span>
              <pre className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-white/90 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(tool.args, null, 2)}
              </pre>
            </div>
          )}
          {tool.result && (
            <div>
              <span className="text-white/40 block mb-0.5 font-sans text-[10px] uppercase tracking-wider">Output:</span>
              <pre className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-white/90 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {typeof tool.result === "string" ? tool.result : JSON.stringify(tool.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --- Branded Askit Sparkle Pulse Loading Indicator (Concept 1) --- */
function ThinkingIndicator() {
  const [statusIdx, setStatusIdx] = useState(0);

  const statuses = [
    "Thinking...",
    "Retrieving context...",
    "Processing data...",
    "Formatting response...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % statuses.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [statuses.length]);

  return (
    <div className="flex w-full justify-start neo-fade-in my-2">
      <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-full bg-zinc-900/90 border border-zinc-800/90 shadow-md backdrop-blur-md text-xs font-sans text-zinc-200 transition-all duration-300">
        {/* Askit Rotating Sparkle Icon */}
        <AskitIcon className="w-4 h-4 animate-[spin_4s_linear_infinite] shrink-0" />

        {/* Dynamic Status Text */}
        <span className="text-zinc-200 text-xs font-medium tracking-wide animate-pulse">
          {statuses[statusIdx]}
        </span>
      </div>
    </div>
  );
}

/* --- SVG Icons --- */
function IconImage({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconCopy({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconRegenerate({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function IconStop({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function IconSend({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
    </svg>
  );
}

function IconArrowDown({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconSettings({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconFile({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function AskitIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(32, 32)">
        <rect x="-4" y="-26" width="12" height="28" rx="6" fill="#ec4899" />
        <rect x="-4" y="-26" width="12" height="28" rx="6" fill="#ec4899" transform="rotate(72)" />
        <rect x="-4" y="-26" width="12" height="28" rx="6" fill="#ec4899" transform="rotate(144)" />
        <rect x="-4" y="-26" width="12" height="28" rx="6" fill="#ec4899" transform="rotate(216)" />
        <rect x="-4" y="-26" width="12" height="28" rx="6" fill="#ec4899" transform="rotate(288)" />
      </g>
    </svg>
  );
}

const SUGGESTION_CARDS = [
  { label: "Check latest news", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg> },
  { label: "Summarize my documents", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
  { label: "Create a study guide", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> },
  { label: "Write a python script", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg> },
];

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-150"
      title="Copy message"
    >
      {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-400" /> : <IconCopy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function Chat({ initialChatId }: { initialChatId: string | null }) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; dataUrl?: string } | null>(null);
  const [attachmentsByMessageId, setAttachmentsByMessageId] = useState<
    Record<string, { imageUrl?: string; fileName?: string }>
  >({});
  const [ingesting, setIngesting] = useState(false);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [loaded, setLoaded] = useState(!initialChatId);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);
  const [lastApiError, setLastApiError] = useState<string | null>(null);

  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const chatIdRef = useRef<string | null>(initialChatId);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const resendAfterEditRef = useRef(false);
  const prevInitialChatIdRef = useRef<string | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  // Use a stable ID for the hook that doesn't change mid-stream
  const [hookId, setHookId] = useState(initialChatId ?? "new-chat");

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    error,
    setMessages,
    reload,
    stop,
    append,
    setInput,
  } = useChat({
    api: "/api/chat",
    id: hookId,
    onFinish: () => {
      setImageDataUrl(null);
      setAttachedFile(null);
      router.refresh();
    },
    onResponse: async (response) => {
      if (!response.ok) {
        try {
          const text = await response.clone().text();
          try {
            const json = JSON.parse(text);
            setLastApiError(json.error || json.message || text);
          } catch {
            setLastApiError(text || `Server error (${response.status})`);
          }
        } catch {
          setLastApiError(`Server error (${response.status})`);
        }
      } else {
        setLastApiError(null);
      }
    },
    onError: () => setDismissedError(false),
  });

  const getHarvestedData = () => {
    if (typeof window === "undefined") return { mcpServers: [], plugins: [] };
    try {
      const mcpServers = JSON.parse(localStorage.getItem("askit_mcp_servers") || "[]");
      const builtInIds = [
        "slack", "figma", "stripe", "github", "notion", "linear", "jira", "google-drive",
        "dropbox", "trello", "asana", "hubspot", "salesforce", "zendesk", "intercom",
        "airtable", "monday", "confluence", "discord", "twitter", "gmail", "outlook",
        "calendly", "zoom", "spotify", "youtube", "twitch", "shopify", "firebase", "vercel",
        "aws", "gcp", "openai", "anthropic", "huggingface"
      ];
      const plugins: any[] = [];
      
      builtInIds.forEach(id => {
        const key = localStorage.getItem(`askit_plugin_${id}`);
        if (key) plugins.push({ id, name: id.charAt(0).toUpperCase() + id.slice(1), key });
      });
      const customList = JSON.parse(localStorage.getItem("askit_custom_plugins") || "[]");
      if (Array.isArray(customList)) {
        customList.forEach((c: any) => {
          const key = localStorage.getItem(`askit_plugin_${c.id}`);
          if (key) plugins.push({ ...c, key });
        });
      }
      return { mcpServers, plugins };
    } catch {
      return { mcpServers: [], plugins: [] };
    }
  };

  const uiMessages = messages as UIMessage[];

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // --- Voice input (browser SpeechRecognition) ---
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingInternalRef = useRef(false);
  const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const voiceTranscriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Win = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionImpl = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return;
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      console.log("Speech recognition started");
    };
    recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          voiceTranscriptRef.current += transcript;
        } else {
          interim += transcript;
        }
      }
      setInput(voiceTranscriptRef.current + interim);
    };
    recognition.onend = () => {
      if (isRecordingInternalRef.current) {
        try {
          recognition.start();
        } catch {
          setIsRecording(false);
          isRecordingInternalRef.current = false;
        }
      } else {
        setIsRecording(false);
      }
    };
    recognition.onerror = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      // Mute 'network' error which is common on localhost or restricted networks.
      // We have a manual recorder fallback so this shouldn't be treated as a crash.
      if (e.error === "network") {
        console.warn("Native speech recognition failed (network). Falling back to manual transcription.");
        return;
      }
      console.error("Speech error:", e.error);
      if (e.error !== "no-speech") {
        setIsRecording(false);
        isRecordingInternalRef.current = false;
      }
    };
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone not supported in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    audioChunksRef.current = [];
    
    let recorder: MediaRecorder;
    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      recorder = new MediaRecorder(stream);
    }
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.start();
  }

  async function stopAndTranscribe() {
    const recorder = mediaRecorderRef.current;
    const stream = mediaStreamRef.current;
    if (!recorder) return "";
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });

    stream?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;

    const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
    audioChunksRef.current = [];
    if (blob.size < 1000) return "";

    const fd = new FormData();
    fd.set("audio", blob, "voice.webm");
    const res = await fetch("/api/transcribe", { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
    if (!res.ok) throw new Error(data.error || "Transcription failed.");
    return (data.text || "").trim();
  }

  async function toggleVoice() {
    const recognition = recognitionRef.current;
    if (isRecording) {
      setIsRecording(false);
      isRecordingInternalRef.current = false;
      try { recognition?.stop?.(); } catch { /* noop */ }
      
      let transcribedText = "";
      try {
        transcribedText = await stopAndTranscribe();
      } catch (err) {
        console.warn("Whisper transcription fallback:", err);
      }

      const finalText = (transcribedText || voiceTranscriptRef.current || input || "").trim();
      if (finalText) {
        forceSubmit(finalText);
      }
    } else {
      setIsRecording(true);
      isRecordingInternalRef.current = true;
      voiceTranscriptRef.current = "";
      setInput("");

      try {
        await startRecording();
      } catch (err) {
        console.warn("MediaRecorder start error:", err);
      }

      if (recognition) {
        try { recognition.start(); } catch { /* noop */ }
      }
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (resendAfterEditRef.current && !isLoading) {
      resendAfterEditRef.current = false;
      reload();
    }
  }, [messages, isLoading, reload]);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    }
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Reset & Transition Logic ---
  const resetChat = useCallback(() => {
    stop();
    setMessages([]);
    setInput("");
    setImageDataUrl(null);
    setAttachedFile(null);
    setDismissedError(false);
    setEditingMessageId(null);
    setEditingContent("");
    setChatId(null);
    setHookId("new-chat");
    chatIdRef.current = null;
    setLoaded(true);
  }, [stop, setMessages, setInput]);

  useEffect(() => {
    const handleResetEvent = () => resetChat();
    window.addEventListener("reset-chat", handleResetEvent);
    return () => window.removeEventListener("reset-chat", handleResetEvent);
  }, [resetChat]);

  useEffect(() => {
    // 1. If initialChatId hasn't changed, do nothing
    if (initialChatId === prevInitialChatIdRef.current) return;

    // 2. If initialChatId changed, check if we're already streaming/active in this chat session
    if (initialChatId !== null && initialChatId === chatIdRef.current && messages.length > 0) {
      prevInitialChatIdRef.current = initialChatId;
      return;
    }

    // 3. Update tracker
    prevInitialChatIdRef.current = initialChatId;

    if (!initialChatId) {
      resetChat();
      return;
    }

    // Mark as loading if we have a chat ID to fetch
    setChatId(initialChatId);
    setHookId(initialChatId);
    chatIdRef.current = initialChatId;
    setLoaded(false);

    let cancelled = false;
    fetch(`/api/chats/${initialChatId}/messages`)
      .then((r) => r.json())
      .then((data: { id: string; role: string; content: string }[]) => {
        if (cancelled || !Array.isArray(data)) return;
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          }))
        );
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId, resetChat]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);


  async function ingestToDocuments(file: File) {
    setIngesting(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", file.name);
      const res = await fetch("/api/documents/ingest", { method: "POST", body: formData });
      const data = (await res.json().catch(() => ({}))) as { error?: string; chunks?: number };
      if (!res.ok) throw new Error(data.error || "Failed to ingest file");
      setAttachedFile({ name: file.name, type: file.type });
    } catch {
      setAttachedFile(null);
    } finally {
      setIngesting(false);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const img = new globalThis.Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 768;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX_DIM) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else if (h > MAX_DIM) {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setImageDataUrl(dataUrl);
        URL.revokeObjectURL(objUrl);
        setAttachedFile({ name: file.name, type: file.type, dataUrl });
      };
      img.src = objUrl;
    } else {
      // Non-image files should be ingested (RAG). Do not dump file content into chat.
      void ingestToDocuments(file);
      setImageDataUrl(null);
    }
    e.target.value = "";
  }

  function removeImage() {
    setImageDataUrl(null);
    setAttachedFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function handleSuggestion(text: string) {
    append({ role: "user", content: text });
  }

  async function forceSubmit(overrideContent?: string) {
    if (isLoading) return;
    const finalContent = overrideContent || (input || "").trim() || voiceTranscriptRef.current.trim() || (imageDataUrl ? "Analyze this image." : (attachedFile ? "Please analyze the attached document." : ""));
    if (!finalContent && !imageDataUrl && !attachedFile) return;

    const currentImg = imageDataUrl;
    const currentFile = attachedFile;
    const hData = getHarvestedData();

    // Ensure we have a chatId before the first message
    if (!chatIdRef.current) {
      try {
        const createRes = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const createData = await createRes.json().catch(() => ({}));
        const newId = createData?.id;
        if (newId) {
          chatIdRef.current = newId;
          setChatId(newId);
          window.history.replaceState(null, "", `/app?chatId=${newId}`);
        }
      } catch (err) {
        console.error("Failed to create chat session:", err);
      }
    }

    const messageId =
      (globalThis.crypto && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;

    if (currentImg || currentFile) {
      setAttachmentsByMessageId((prev) => ({
        ...prev,
        [messageId]: {
          imageUrl: currentImg ?? undefined,
          fileName: currentFile?.name ?? undefined,
        },
      }));
    }

    append(
      { id: messageId, role: "user", content: finalContent },
      { 
        body: { 
          chatId: chatIdRef.current, 
          imageUrl: currentImg ?? undefined,
          ...hData 
        } 
      }
    );

    setInput("");
    voiceTranscriptRef.current = "";
    setImageDataUrl(null);
    setAttachedFile(null);
    setDismissedError(false);
  }

  const lastAssistantIdx = uiMessages
    .map((m, i) => (m.role === "assistant" ? i : -1))
    .filter((i) => i >= 0)
    .pop();

  const showError = error && !dismissedError;

  return (
    <div className="flex w-full h-full bg-neo-black relative overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
      {/* Scrollable Chat Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto w-full p-3 sm:p-6 pt-20 sm:pt-24 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="max-w-3xl mx-auto w-full flex flex-col min-h-full pb-[140px]">

          {messages.length === 0 && !isLoading && !initialChatId && (
            <div
              className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4"
            >
              <div className="max-w-xl w-full text-center">
                {/* Askit Logo Mark */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-6 flex items-center justify-center">
                  <AskitIcon className="w-14 h-14 sm:w-16 sm:h-16" />
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight text-zinc-100 font-sans">
                  How can I help you today?
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm mb-8 sm:mb-10 max-w-lg mx-auto leading-relaxed px-2">
                  Your personal assistant with retrieval augmented generation,
                  multimodal vision, voice input and powerful tools.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full max-w-lg mx-auto">
                  {SUGGESTION_CARDS.map(({ label, icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSuggestion(label)}
                      className="group px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl text-[12px] sm:text-[13px] text-left active:scale-[0.97] touch-manipulation transition-all duration-200 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 shadow-sm"
                    >
                      <span className="mr-2 inline-flex align-middle text-zinc-400">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-5 sm:gap-6 w-full mb-4">
            {uiMessages.map((m, idx) => (
              <div key={m.id} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"} neo-fade-in`}>
                <div className={`flex w-full ${m.role === "user" ? "max-w-[85%] sm:max-w-[80%] lg:max-w-[70%] flex-col items-end" : "max-w-full lg:max-w-[90%] flex-col items-start"}`}>

                  {m.role === "user" ? (
                    <div className="group/user relative">
                      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-zinc-800/90 text-zinc-100 rounded-2xl rounded-br-md text-[13px] sm:text-[14px] break-words shadow-sm border border-zinc-700/60">
                        {attachmentsByMessageId[m.id]?.imageUrl && (
                          <div className="mb-3 relative w-32 h-32 sm:w-48 sm:h-48 rounded-xl overflow-hidden border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={attachmentsByMessageId[m.id]!.imageUrl!}
                              alt="Attached"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        {attachmentsByMessageId[m.id]?.fileName && !attachmentsByMessageId[m.id]?.imageUrl && (
                          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/5 rounded-lg w-max max-w-full text-xs text-neo-white-muted/80">
                            <IconFile className="w-4 h-4 shrink-0" />
                            <span className="truncate">{attachmentsByMessageId[m.id]!.fileName!}</span>
                          </div>
                        )}

                        {editingMessageId === m.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  const i = messages.findIndex((msg) => msg.id === m.id);
                                  if (i >= 0) {
                                    const updated = { ...m, content: editingContent };
                                    setMessages((prev) => [...prev.slice(0, i), updated]);
                                    setEditingMessageId(null);
                                    resendAfterEditRef.current = true;
                                  }
                                } else if (e.key === "Escape") {
                                  setEditingMessageId(null);
                                }
                              }}
                              className="w-full min-h-[48px] bg-white/5 rounded-lg px-3 py-2 text-neo-white resize-none text-sm outline-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => { const i = messages.findIndex((msg) => msg.id === m.id); if (i >= 0) { setMessages((prev) => [...prev.slice(0, i), { ...m, content: editingContent }]); setEditingMessageId(null); resendAfterEditRef.current = true; } }} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">Save & resend</button>
                              <button type="button" onClick={() => setEditingMessageId(null)} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-neo-white-muted hover:bg-white/10 transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : typeof m.content === "string" ? (
                          <>{m.content}</>
                        ) : Array.isArray(m.content) ? (
                          <div className="flex flex-col gap-3">
                            {(m.content as { type: string; image?: string; text?: string }[]).map((p, i) => {
                              if (p.type === "image" && p.image) {
                                return (
                                  <div key={i} className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden">
                                    <Image src={p.image} alt="Uploaded" fill className="object-cover" unoptimized />
                                  </div>
                                );
                              }
                              if (p.type === "text") return <span key={i}>{p.text}</span>;
                              return null;
                            })}
                          </div>
                        ) : null}
                      </div>
                      {editingMessageId !== m.id && typeof m.content === "string" && (
                        <button
                          type="button"
                          onClick={() => { setEditingMessageId(m.id); setEditingContent(m.content as string); }}
                          className="absolute -bottom-6 right-2 opacity-0 group-hover/user:opacity-100 p-1 rounded-md text-neo-white-muted/50 hover:text-neo-white hover:bg-white/[0.06] transition-all text-xs"
                          title="Edit"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col w-full text-[13px] sm:text-[14px] text-neo-white">
                      {/* Tool Invocations */}
                      {m.toolInvocations && m.toolInvocations.length > 0 && (
                        <div className="flex flex-col gap-1 mb-3">
                          {m.toolInvocations.map((tool) => (
                            <ToolInvocationCard key={tool.toolCallId} tool={tool} />
                          ))}
                        </div>
                      )}

                      <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-[13px] sm:text-[14px] leading-relaxed">
                        <MarkdownRenderer
                          content={
                            (() => {
                              const raw = typeof m.content === "string" ? m.content : "";
                              const cleaned = raw
                                .replace(/<(web_search|search_documents|youtube_api|spotify_api|github_api|function[\w_]*)[^>]*>[\s\S]*?<\/\1>/gi, "")
                                .replace(/<(web_search|search_documents|youtube_api|spotify_api|github_api|function[\w_]*)[^>]*>[\s\S]*/gi, "")
                                .trim();
                              if (cleaned) return cleaned;
                              if (m.toolInvocations && m.toolInvocations.length > 0) {
                                return "Search & tool processing completed.";
                              }
                              return "I couldn't find a direct response for this query. Please try rephrasing or check your connected plugins.";
                            })()
                          }
                          onOpenArtifact={(art) => {
                            setActiveArtifact(art);
                            setIsArtifactOpen(true);
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-1 mt-3 opacity-0 hover:opacity-100 transition-opacity duration-200" style={{ opacity: idx === lastAssistantIdx ? 1 : undefined }}>
                        <CopyMessageButton text={m.content} />
                        {idx === lastAssistantIdx && !isLoading && (
                          <button
                            type="button"
                            onClick={() => reload()}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-150"
                            title="Regenerate"
                          >
                            <IconRegenerate className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
              <ThinkingIndicator />
            )}

            {showError && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs sm:text-sm max-w-lg neo-fade-in">
                <span className="flex-1">{lastApiError || error.message || "Something went wrong."}</span>
                <button type="button" onClick={() => setDismissedError(true)} className="shrink-0 p-1 rounded hover:bg-red-500/20 transition-colors">
                  <IconX className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-[#1a1a1d] border border-white/10 text-neo-white-muted hover:text-neo-white p-2.5 rounded-full z-20 transition-all duration-200 hover:scale-110 shadow-2xl"
        >
          <IconArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* --- INPUT BAR --- */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 sm:px-6 pb-3 sm:pb-4 pt-2 bg-gradient-to-t from-neo-black via-neo-black/95 to-transparent pointer-events-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            forceSubmit();
          }}
          className="max-w-3xl mx-auto w-full pointer-events-auto"
        >
          {/* Image / File preview */}
          {(imageDataUrl || (attachedFile && !imageDataUrl)) && (
            <div className="flex mb-2">
              {imageDataUrl ? (
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <Image src={imageDataUrl} alt="Preview" fill className="object-cover" unoptimized />
                  <button type="button" onClick={removeImage} className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 rounded-full text-white hover:bg-black transition-colors">
                    <IconX className="w-3 h-3" />
                  </button>
                </div>
              ) : attachedFile ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
                  <IconFile className="w-4 h-4 text-neo-white-muted/60" />
                  <span className="text-xs text-neo-white-muted truncate max-w-[200px]">{attachedFile.name}</span>
                  {ingesting && <span className="text-[10px] text-white/25">Ingesting…</span>}
                  <button type="button" onClick={removeImage} className="p-0.5 rounded-full text-neo-white-muted/60 hover:text-white transition-colors">
                    <IconX className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-3 mb-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 text-red-300">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium">Listening...</p>
                <p className="text-[10px] sm:text-xs text-red-300/60 truncate">Speak clearly - Click mic to stop & send</p>
              </div>
              <button
                type="button"
                onClick={toggleVoice}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors shrink-0"
              >
                Stop
              </button>
            </div>
          )}

          <div className="flex items-end gap-1.5 sm:gap-2 rounded-xl border border-zinc-800 bg-zinc-950/90 p-2 sm:p-2.5 shadow-lg backdrop-blur-md focus-within:border-zinc-700 transition-all duration-150" data-recording={isRecording}>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.md,.json,.csv,.py,.js,.ts,.html,.css"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Attach button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="shrink-0 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-150 touch-manipulation"
              title="Attach image or file"
            >
              <IconImage className="w-5 h-5" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  forceSubmit();
                }
              }}
              placeholder="Message Askit..."
              className="flex-1 bg-transparent text-sm outline-none text-zinc-100 resize-none max-h-32 py-2 placeholder:text-zinc-500 leading-relaxed scrollbar-hide [&::-webkit-scrollbar]:hidden min-w-0"
              rows={1}
              disabled={isLoading}
            />

            {/* Voice button */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`shrink-0 p-2 rounded-xl transition-all duration-200 touch-manipulation ${isRecording
                ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/30 animate-pulse"
                : "text-white/30 hover:text-white/70 hover:bg-white/[0.06]"
                }`}
              title={isRecording ? "Stop recording & send" : "Voice input"}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isRecording ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isRecording ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {isRecording ? (
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                ) : (
                  <>
                    <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
                    <path d="M19 10a7 7 0 0 1-14 0" />
                    <path d="M12 17v4" />
                    <path d="M8 21h8" />
                  </>
                )}
              </svg>
            </button>

            {/* Send / Stop */}
            {isLoading ? (
              <button type="button" onClick={() => stop()} className="shrink-0 p-2 rounded-xl bg-white/10 text-neo-white hover:bg-white/15 transition-all duration-150 touch-manipulation" title="Stop">
                <IconStop className="w-5 h-5" />
              </button>
            ) : (
              <button
                ref={submitBtnRef}
                type="submit"
                disabled={(!input || !input.trim()) && !imageDataUrl && !attachedFile}
                className="shrink-0 p-2 rounded-xl bg-white text-black disabled:opacity-20 disabled:bg-white/10 disabled:text-neo-white-muted hover:bg-gray-100 active:scale-95 transition-all duration-150 outline-none touch-manipulation"
                title="Send"
              >
                <IconSend className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-center text-[10px] text-white/15 mt-2 hidden sm:block">
            Askit can make mistakes. Verify important info.
          </p>
        </form>
      </div>
      </div>
      <ArtifactPanel
        artifact={activeArtifact}
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
      />
    </div>
  );
}

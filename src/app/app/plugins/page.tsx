"use client";

import { useState, useEffect } from "react";

const LOGO_BASE = "https://www.google.com/s2/favicons?domain=";
const LOGO_SIZES = "&sz=64";

type Plugin = { id: string; name: string; desc: string; domain: string; category: string };

type CustomPlugin = { id: string; name: string; domain: string; };

const PLUGINS: Plugin[] = [
  { id: "slack", name: "Slack", desc: "Send messages, list channels, and search in your workspace.", domain: "slack.com", category: "Communication" },
  { id: "figma", name: "Figma", desc: "Read files, list projects, and get design context.", domain: "figma.com", category: "Design" },
  { id: "stripe", name: "Stripe", desc: "Check balance, list customers, and view payments.", domain: "stripe.com", category: "Finance" },
  { id: "github", name: "GitHub", desc: "List repos, read files, and search code.", domain: "github.com", category: "Development" },
  { id: "notion", name: "Notion", desc: "Read pages and databases from your workspace.", domain: "notion.so", category: "Productivity" },
  { id: "linear", name: "Linear", desc: "Issues, cycles, and project management.", domain: "linear.app", category: "Development" },
  { id: "jira", name: "Jira", desc: "Atlassian issues and sprints.", domain: "atlassian.com", category: "Development" },
  { id: "google-drive", name: "Google Drive", desc: "List and read files from Drive.", domain: "drive.google.com", category: "Productivity" },
  { id: "dropbox", name: "Dropbox", desc: "Access and list files from Dropbox.", domain: "dropbox.com", category: "Productivity" },
  { id: "trello", name: "Trello", desc: "Boards, lists, and cards.", domain: "trello.com", category: "Productivity" },
  { id: "asana", name: "Asana", desc: "Tasks and projects.", domain: "asana.com", category: "Productivity" },
  { id: "hubspot", name: "HubSpot", desc: "CRM and marketing automation.", domain: "hubspot.com", category: "Sales" },
  { id: "salesforce", name: "Salesforce", desc: "CRM and sales data.", domain: "salesforce.com", category: "Sales" },
  { id: "zendesk", name: "Zendesk", desc: "Support tickets and knowledge base.", domain: "zendesk.com", category: "Support" },
  { id: "intercom", name: "Intercom", desc: "Customer messaging and inbox.", domain: "intercom.com", category: "Support" },
  { id: "airtable", name: "Airtable", desc: "Bases and records.", domain: "airtable.com", category: "Productivity" },
  { id: "monday", name: "Monday.com", desc: "Work management and boards.", domain: "monday.com", category: "Productivity" },
  { id: "confluence", name: "Confluence", desc: "Wikis and documentation.", domain: "atlassian.com", category: "Productivity" },
  { id: "discord", name: "Discord", desc: "Servers and channels.", domain: "discord.com", category: "Communication" },
  { id: "twitter", name: "X (Twitter)", desc: "Tweets and timeline.", domain: "twitter.com", category: "Social" },
  { id: "gmail", name: "Gmail", desc: "Read and send emails.", domain: "gmail.com", category: "Communication" },
  { id: "outlook", name: "Outlook", desc: "Calendar and mail.", domain: "outlook.com", category: "Communication" },
  { id: "calendly", name: "Calendly", desc: "Scheduling and availability.", domain: "calendly.com", category: "Productivity" },
  { id: "zoom", name: "Zoom", desc: "Meetings and recordings.", domain: "zoom.us", category: "Communication" },
  { id: "spotify", name: "Spotify", desc: "Browse playlists, tracks, and listening history.", domain: "spotify.com", category: "Entertainment" },
  { id: "youtube", name: "YouTube", desc: "Search videos, channels, and playlists.", domain: "youtube.com", category: "Entertainment" },
  { id: "twitch", name: "Twitch", desc: "Stream info, channels, and clips.", domain: "twitch.tv", category: "Entertainment" },
  { id: "shopify", name: "Shopify", desc: "Manage products, orders, and inventory.", domain: "shopify.com", category: "E-Commerce" },
  { id: "firebase", name: "Firebase", desc: "Database, auth, and cloud functions.", domain: "firebase.google.com", category: "Development" },
  { id: "vercel", name: "Vercel", desc: "Deployments, domains, and logs.", domain: "vercel.com", category: "Development" },
  { id: "aws", name: "AWS", desc: "Cloud services, S3, Lambda, and more.", domain: "aws.amazon.com", category: "Cloud" },
  { id: "gcp", name: "Google Cloud", desc: "Cloud computing and data services.", domain: "cloud.google.com", category: "Cloud" },
  { id: "openai", name: "OpenAI", desc: "GPT models and DALL-E.", domain: "openai.com", category: "AI" },
  { id: "anthropic", name: "Anthropic", desc: "Claude AI models.", domain: "anthropic.com", category: "AI" },
  { id: "huggingface", name: "Hugging Face", desc: "ML models and datasets.", domain: "huggingface.co", category: "AI" },
];

export default function PluginsPage() {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [apiKey, setApiKey] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPlugins, setCustomPlugins] = useState<CustomPlugin[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = new Set<string>();
    PLUGINS.forEach((p) => {
      if (localStorage.getItem(`askit_plugin_${p.id}`)) saved.add(p.id);
    });
    // Load custom plugins
    try {
      const customs = JSON.parse(localStorage.getItem("askit_custom_plugins") || "[]") as CustomPlugin[];
      setCustomPlugins(Array.isArray(customs) ? customs : []);
      customs.forEach((c) => {
        if (localStorage.getItem(`askit_plugin_${c.id}`)) saved.add(c.id);
      });
    } catch {/* noop */}
    setConnected(saved);
  }, []);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function handleConnect(id: string) {
    setConnectingId(id);
    setApiKey("");
    setCustomName("");
  }

  function handleSaveKey() {
    if (!connectingId) return;
    const key = apiKey.trim();
    if (!key) return;

    if (connectingId === "custom") {
      // Custom plugin: save name + key
      const name = customName.trim() || "Custom Plugin";
      const id = `custom_${Date.now()}`;
      const domain = name.toLowerCase().replace(/\s+/g, "-");
      const newPlugin: CustomPlugin = { id, name, domain };
      const updatedCustoms = [...customPlugins, newPlugin];
      setCustomPlugins(updatedCustoms);
      setConnected((prev) => new Set(prev).add(id));
      try {
        localStorage.setItem(`askit_plugin_${id}`, key);
        localStorage.setItem("askit_custom_plugins", JSON.stringify(updatedCustoms));
      } catch {/* noop */}
      showSuccess(`"${name}" connected successfully`);
    } else {
      // Built-in plugin
      setConnected((prev) => new Set(prev).add(connectingId));
      try {
        localStorage.setItem(`askit_plugin_${connectingId}`, key);
      } catch {/* noop */}
      const pluginName = PLUGINS.find((x) => x.id === connectingId)?.name || connectingId;
      showSuccess(`"${pluginName}" connected successfully`);
    }

    setConnectingId(null);
    setApiKey("");
    setCustomName("");
  }

  function handleDisconnect(id: string) {
    setConnected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      localStorage.removeItem(`askit_plugin_${id}`);
      // If it's a custom plugin, remove from list
      if (id.startsWith("custom_")) {
        const updatedCustoms = customPlugins.filter((c) => c.id !== id);
        setCustomPlugins(updatedCustoms);
        localStorage.setItem("askit_custom_plugins", JSON.stringify(updatedCustoms));
      }
    } catch {/* noop */}
  }

  const connectedCount = connected.size;

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 sm:py-8 pt-20 sm:pt-24">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1
            className="text-xl sm:text-2xl tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, color: "var(--neo-white)" }}
          >
            Plugins
          </h1>
          {connectedCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              {connectedCount} active
            </span>
          )}
        </div>
        <p className="text-white/40 text-xs sm:text-sm">Connect API keys to extend the AI assistant with external services.</p>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm neo-fade-in">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Custom Plugin Card */}
        <div
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer active:scale-[0.98] touch-manipulation"
          onClick={() => handleConnect("custom")}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neo-white">Add Custom Plugin</p>
            <p className="text-[11px] text-white/30">Connect any service with an API key</p>
          </div>
        </div>

        {/* Custom Plugins - show connected ones */}
        {customPlugins.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
              connected.has(p.id)
                ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                : "border-white/[0.04] bg-white/[0.02]"
            }`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-600/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-pink-400">{p.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neo-white truncate">{p.name}</p>
              <p className="text-[11px] text-white/30">Custom plugin</p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => handleDisconnect(p.id)}
                className="text-[11px] px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
              >
                ✓ Connected
              </button>
            </div>
          </div>
        ))}

        {/* Built-in Plugins */}
        {PLUGINS.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${connected.has(p.id)
                ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                : "border-white/[0.04] bg-white/[0.02]"
              }`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${LOGO_BASE}${p.domain}${LOGO_SIZES}`}
                alt=""
                className="w-5 h-5 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neo-white truncate">{p.name}</p>
              <p className="text-[11px] text-white/30 truncate hidden sm:block">{p.desc}</p>
            </div>
            <div className="shrink-0">
              {connected.has(p.id) ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect(p.id)}
                  className="text-[11px] px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
                >
                  ✓ Connected
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect(p.id)}
                  className="text-[11px] px-2 sm:px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connection Modal */}
      {connectingId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setConnectingId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111113] p-5 sm:p-6 shadow-2xl relative neo-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-neo-white mb-1.5 text-sm sm:text-base">
              {connectingId === "custom"
                ? "Connect Custom Plugin"
                : `Connect ${PLUGINS.find((x) => x.id === connectingId)?.name}`}
            </h3>
            <p className="text-[11px] sm:text-xs text-white/30 mb-4">
              API key is stored securely in your browser only.
            </p>
            {connectingId === "custom" && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Plugin name (e.g., My API)"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neo-white text-sm placeholder-white/20 outline-none focus:border-white/[0.12] mb-3 transition-colors"
                autoFocus
              />
            )}
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveKey();
              }}
              placeholder="Paste your API key"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neo-white text-sm placeholder-white/20 outline-none focus:border-white/[0.12] mb-4 transition-colors"
              autoFocus={connectingId !== "custom"}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveKey}
                disabled={!apiKey.trim() || (connectingId === "custom" && !customName.trim())}
                className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
              >
                Connect
              </button>
              <button
                type="button"
                onClick={() => setConnectingId(null)}
                className="px-3 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:bg-white/[0.04] transition-colors active:scale-[0.98] touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

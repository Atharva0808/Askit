import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Askit",
  description: "Premium AI assistant with RAG, MCP, and multimodal capabilities.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/sakura.png", type: "image/png" },
    ],
    apple: "/sakura.png",
  },
};

import { PWARegistration } from "@/components/pwa-registration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen antialiased bg-neo-black text-neo-white" suppressHydrationWarning>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}

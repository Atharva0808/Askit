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
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen antialiased bg-neo-black text-neo-white" suppressHydrationWarning>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}

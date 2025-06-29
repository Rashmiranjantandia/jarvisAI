import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "JARVIS OS — AI Command Center",
  description: "A futuristic AI assistant dashboard with real-time voice interaction, clap detection, AI chat, task management, and memory persistence.",
  keywords: ["AI assistant", "JARVIS", "voice control", "AI dashboard", "OpenRouter", "Next.js"],
  authors: [{ name: "Rashmiranjan Tandia" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#020b18] text-[#e0f7ff] overflow-hidden`}>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(0,20,40,0.9)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#e0f7ff",
            },
          }}
          position="bottom-right"
        />
      </body>
    </html>
  );
}

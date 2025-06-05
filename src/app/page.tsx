"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import DashboardPanel from "@/components/panels/DashboardPanel";
import { useJarvisStore } from "@/store/jarvis-store";
import dynamic from "next/dynamic";

// Lazy load heavier panels
const ChatPanel = dynamic(() => import("@/components/panels/ChatPanel"), { ssr: false });
const VoicePanel = dynamic(() => import("@/components/panels/VoicePanel"), { ssr: false });
const TasksPanel = dynamic(() => import("@/components/panels/TasksPanel"), { ssr: false });
const NotesPanel = dynamic(() => import("@/components/panels/NotesPanel"), { ssr: false });
const ActivityPanel = dynamic(() => import("@/components/panels/ActivityPanel"), { ssr: false });
const MemoryPanel = dynamic(() => import("@/components/panels/MemoryPanel"), { ssr: false });
const SettingsPanel = dynamic(() => import("@/components/panels/SettingsPanel"), { ssr: false });

const PANELS: Record<string, React.ComponentType> = {
  dashboard: DashboardPanel,
  chat: ChatPanel,
  voice: VoicePanel,
  tasks: TasksPanel,
  notes: NotesPanel,
  activity: ActivityPanel,
  memory: MemoryPanel,
  settings: SettingsPanel,
};

export default function JarvisOS() {
  const { activePanel, incrementStat, setActivePanel } = useJarvisStore();

  // Increment uptime every minute
  useEffect(() => {
    const timer = setInterval(() => {
      incrementStat("uptime");
    }, 60000);
    return () => clearInterval(timer);
  }, [incrementStat]);

  // Keyboard shortcuts for panel navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + number keys for panel switching
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const shortcuts: Record<string, string> = {
          "1": "dashboard",
          "2": "chat",
          "3": "voice",
          "4": "tasks",
          "5": "notes",
          "6": "activity",
          "7": "memory",
          "8": "settings",
        };
        const panel = shortcuts[e.key];
        if (panel) {
          e.preventDefault();
          setActivePanel(panel);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActivePanel]);

  const ActivePanel = PANELS[activePanel] ?? DashboardPanel;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020b18] relative">
      {/* Background ambient grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Ambient glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />

        {/* Panel content */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <ActivePanel />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

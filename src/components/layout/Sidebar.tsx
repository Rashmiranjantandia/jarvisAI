"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  FileText,
  Activity,
  Settings,
  Mic,
  Zap,
  ChevronLeft,
  ChevronRight,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useJarvisStore } from "@/store/jarvis-store";

const navItems = [
  { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "voice", label: "Voice Interface", icon: Mic },
  { id: "tasks", label: "Operations", icon: CheckSquare },
  { id: "notes", label: "Intelligence Notes", icon: FileText },
  { id: "activity", label: "Activity Feed", icon: Activity },
  { id: "memory", label: "AI Memory", icon: Brain },
  { id: "settings", label: "System Config", icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activePanel, setActivePanel } = useJarvisStore();

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-full glass-strong border-r border-jarvis-blue/10 z-20 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-jarvis-blue/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center animate-pulse-glow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold neon-text tracking-widest">JARVIS</p>
                <p className="text-[10px] text-cyan-400/60 tracking-wider uppercase">OS v2.0</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 neon-border"
                  : "text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/8"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 relative z-10 transition-all",
                  isActive && "text-cyan-300"
                )}
              />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs font-medium relative z-10 truncate text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full glass-strong border border-cyan-500/20 flex items-center justify-center text-cyan-400 hover:text-cyan-200 hover:border-cyan-400/50 transition-all z-30"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>

      {/* Status indicator */}
      <div className="p-3 border-t border-cyan-500/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-green-400/70 uppercase tracking-wider"
              >
                Systems Online
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

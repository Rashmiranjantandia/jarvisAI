"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Settings, Mic, MicOff, ChevronDown } from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { formatTime, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { notifications, voiceEnabled, setVoiceEnabled, setActivePanel, activePanel } =
    useJarvisStore();
  const [time, setTime] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const notifColors = {
    info: "text-cyan-400",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 glass-strong border-b border-cyan-500/10 z-10">
      {/* Left: Panel Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-cyan-200 uppercase tracking-widest">
          {activePanel.replace("-", " ")}
        </h1>
        <div className="h-4 w-px bg-cyan-500/20" />
        <span className="text-[10px] text-cyan-400/50 font-mono uppercase tracking-wider">
          JARVIS OS
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-mono text-cyan-300 tabular-nums">
            {formatTime(time)}
          </p>
          <p className="text-[10px] text-cyan-400/40 font-mono">
            {formatDate(time)}
          </p>
        </div>

        <div className="h-8 w-px bg-cyan-500/10" />

        {/* Voice Toggle */}
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            voiceEnabled
              ? "bg-cyan-500/20 text-cyan-300 shadow-neon-blue"
              : "text-cyan-400/40 hover:text-cyan-400 hover:bg-cyan-500/10"
          )}
          title={voiceEnabled ? "Disable Voice" : "Enable Voice"}
        >
          {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-lg text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>

          {showNotifs && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute right-0 top-12 w-72 glass-strong rounded-xl border border-cyan-500/15 shadow-panel overflow-hidden z-50"
            >
              <div className="p-3 border-b border-cyan-500/10">
                <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  Notifications
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-cyan-400/40 text-center">
                    All clear, Director.
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-3 border-b border-cyan-500/5 hover:bg-cyan-500/5 transition-colors",
                        !n.read && "bg-cyan-500/5"
                      )}
                    >
                      <p
                        className={cn(
                          "text-xs font-medium",
                          notifColors[n.type]
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-[11px] text-cyan-400/50 mt-0.5">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => setActivePanel("settings")}
          className="p-2 rounded-lg text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

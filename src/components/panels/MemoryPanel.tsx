"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  Clock,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { cn } from "@/lib/utils";

export default function MemoryPanel() {
  const { sessions, deleteSession, stats } = useJarvisStore();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass panel-glow rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 hud-grid opacity-30" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[11px] text-cyan-400/50 uppercase tracking-[0.2em] mb-1">
              Contextual Storage
            </p>
            <h2 className="text-xl font-bold text-white">
              AI <span className="neon-text">Memory</span> Layer
            </h2>
            <p className="text-sm text-cyan-400/40 mt-1">
              All conversation sessions and context are persisted locally.
            </p>
          </div>
          <div className="text-right space-y-1">
            <div>
              <p className="text-2xl font-bold text-white tabular-nums">{sessions.length}</p>
              <p className="text-[10px] text-cyan-400/40">sessions</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { icon: MessageSquare, label: "Total Messages", value: totalMessages, color: "text-cyan-400" },
          { icon: Brain, label: "AI Interactions", value: stats.messagesProcessed, color: "text-purple-400" },
          { icon: Clock, label: "Uptime (min)", value: stats.uptime, color: "text-green-400" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="glass panel-glow rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center flex-shrink-0">
                <Icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">{item.value}</p>
                <p className="text-[10px] text-cyan-400/40">{item.label}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions and messages..."
          className="w-full glass border border-cyan-500/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cyan-200 placeholder-cyan-400/30 focus:outline-none focus:border-cyan-500/30 transition-colors"
        />
      </div>

      {/* Session list */}
      <div className="space-y-3">
        <p className="text-[11px] text-cyan-400/40 uppercase tracking-wider font-medium">
          Conversation Sessions ({filtered.length})
        </p>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Brain className="w-10 h-10 text-cyan-400/20" />
            <p className="text-sm text-cyan-400/40">
              {sessions.length === 0
                ? "No sessions yet. Start a conversation in AI Chat."
                : "No sessions match your search."}
            </p>
          </div>
        ) : (
          filtered.map((session, i) => {
            const isExpanded = expandedId === session.id;
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass panel-glow rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-cyan-500/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-cyan-400/60" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium text-cyan-200 truncate">
                        {session.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-cyan-400/40 font-mono">
                          {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-[10px] text-cyan-400/25">·</span>
                        <span className="text-[10px] text-cyan-400/40 font-mono">
                          {session.provider} / {session.model}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-cyan-400/30 font-mono hidden sm:block">
                      {new Date(session.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1 rounded text-red-400/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-cyan-400/30 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </div>
                </button>

                {isExpanded && session.messages.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-cyan-500/8 max-h-80 overflow-y-auto"
                  >
                    {session.messages.slice(-10).map((msg, mi) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "px-4 py-3 border-b border-cyan-500/5 last:border-0",
                          msg.role === "user" ? "bg-cyan-500/3" : ""
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wider font-bold",
                            msg.role === "user" ? "text-cyan-400/50" : "text-purple-400/50"
                          )}
                        >
                          {msg.role}
                        </span>
                        <p className="text-xs text-cyan-200/70 mt-1 line-clamp-3">
                          {msg.content || "(streaming...)"}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

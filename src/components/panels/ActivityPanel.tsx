"use client";

import { motion } from "framer-motion";
import {
  Activity,
  MessageSquare,
  CheckSquare,
  FileText,
  Zap,
  Mic,
} from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/types";

const TYPE_CONFIG: Record<
  ActivityItem["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  task: { icon: CheckSquare, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  chat: { icon: MessageSquare, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  note: { icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  system: { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  voice: { icon: Mic, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
};

function ActivityEntry({ item, index }: { item: ActivityItem; index: number }) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-start gap-4"
    >
      {/* Timeline indicator */}
      <div className="flex flex-col items-center gap-0 flex-shrink-0 mt-1">
        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", config.bg)}>
          <Icon className={cn("w-3.5 h-3.5", config.color)} />
        </div>
        <div className="w-px flex-1 bg-cyan-500/8 min-h-[20px]" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-cyan-200">{item.title}</p>
            {item.description && (
              <p className="text-xs text-cyan-400/50 mt-0.5 truncate">{item.description}</p>
            )}
          </div>
          <span className="text-[10px] text-cyan-400/30 font-mono flex-shrink-0 mt-0.5">
            {new Date(item.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function groupByDate(activities: ActivityItem[]) {
  const groups: Record<string, ActivityItem[]> = {};
  activities.forEach((a) => {
    const date = new Date(a.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(a);
  });
  return groups;
}

export default function ActivityPanel() {
  const { activities, stats } = useJarvisStore();
  const grouped = groupByDate(activities);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <p className="text-[11px] text-cyan-400/50 uppercase tracking-[0.2em] mb-1">
            System Logs
          </p>
          <h2 className="text-xl font-bold text-white">
            Activity <span className="neon-text">Feed</span>
          </h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white tabular-nums">{activities.length}</p>
          <p className="text-[11px] text-cyan-400/40">total events</p>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { icon: MessageSquare, label: "AI Messages", value: stats.messagesProcessed, color: "text-cyan-400" },
          { icon: CheckSquare, label: "Tasks Done", value: stats.tasksCompleted, color: "text-green-400" },
          { icon: Mic, label: "Voice Cmds", value: stats.voiceInteractions, color: "text-blue-400" },
          { icon: Zap, label: "Uptime (min)", value: stats.uptime, color: "text-yellow-400" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="glass panel-glow rounded-xl p-3 flex items-center gap-3">
              <Icon className={cn("w-4 h-4 flex-shrink-0", item.color)} />
              <div>
                <p className="text-lg font-bold text-white tabular-nums">{item.value}</p>
                <p className="text-[10px] text-cyan-400/40">{item.label}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-0"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-cyan-500/8" />
              <span className="text-[10px] text-cyan-400/40 uppercase tracking-widest font-medium px-2">
                {date}
              </span>
              <div className="h-px flex-1 bg-cyan-500/8" />
            </div>
            <div>
              {items.map((item, i) => (
                <ActivityEntry key={item.id} item={item} index={i} />
              ))}
            </div>
          </motion.div>
        ))}

        {activities.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Activity className="w-10 h-10 text-cyan-400/20" />
            <p className="text-sm text-cyan-400/40">No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

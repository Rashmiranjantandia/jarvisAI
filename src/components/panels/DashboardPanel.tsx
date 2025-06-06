"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap, CheckSquare, MessageSquare, Brain, Activity,
  TrendingUp, Clock, Cpu, MemoryStick, Wifi
} from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "cyan",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  };
  return (
    <motion.div
      variants={itemVariants}
      className="glass panel-glow rounded-xl p-4 flex items-center gap-4"
    >
      <div className={cn("w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-cyan-400/60">{label}</p>
        {sub && <p className="text-[10px] text-cyan-400/30 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function SystemMetric({ label, value, max = 100, color }: {
  label: string; value: number; max?: number; color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-cyan-400/60 uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-mono text-cyan-300">{value}%</span>
      </div>
      <div className="h-1.5 bg-cyan-500/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
          style={{ boxShadow: `0 0 8px currentColor` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPanel() {
  const { tasks, sessions, stats, activities, notifications } = useJarvisStore();
  const [time, setTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState(23);
  const [netUsage, setNetUsage] = useState(67);
  // Track online/offline status for system status indicator
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setCpuUsage(Math.floor(Math.random() * 30) + 15);
      setNetUsage(Math.floor(Math.random() * 40) + 40);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Hero HUD */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass panel-glow rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 hud-grid opacity-50" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[11px] text-cyan-400/50 uppercase tracking-[0.2em] mb-2">
              JARVIS OS — AI Command Center
            </p>
            <h2 className="text-3xl font-bold text-white mb-1">
              Good{" "}
              <span className="neon-text">
                {time.getHours() < 12
                  ? "Morning"
                  : time.getHours() < 17
                  ? "Afternoon"
                  : "Evening"}
              </span>
              , Director.
            </h2>
            <p className="text-sm text-cyan-400/60">
              {pendingTasks > 0
                ? `You have ${pendingTasks} pending operation${pendingTasks > 1 ? "s" : ""} requiring attention.`
                : "All systems nominal. Ready to receive your command."}
            </p>
            {/* System online/offline indicator */}
            <div className="flex items-center gap-1.5 mt-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-400 animate-pulse" : "bg-red-400")} />
              <span className="text-[10px] text-cyan-400/40 uppercase tracking-wider font-mono">
                {isOnline ? "Network Connected" : "Network Offline"}
              </span>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-3xl font-mono font-bold text-cyan-300 tabular-nums text-glow">
              {formatTime(time)}
            </p>
            <p className="text-xs text-cyan-400/40 mt-1 font-mono">
              {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Animated scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={CheckSquare} label="Pending Tasks" value={pendingTasks} color="cyan" />
        <StatCard icon={CheckSquare} label="Completed" value={completedTasks} color="green" sub="tasks done" />
        <StatCard icon={MessageSquare} label="AI Sessions" value={sessions.length} color="purple" />
        <StatCard icon={Zap} label="Notifications" value={unreadNotifs} color="orange" sub="unread" />
      </motion.div>

      {/* System Monitor + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Monitor */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass panel-glow rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              System Monitor
            </h3>
          </div>
          <SystemMetric label="CPU" value={cpuUsage} color="bg-cyan-400" />
          <SystemMetric label="Memory" value={stats.memoryUsage} color="bg-purple-400" />
          <SystemMetric label="Network" value={netUsage} color="bg-green-400" />
          <SystemMetric label="AI Load" value={Math.floor(stats.messagesProcessed * 1.2) % 100} color="bg-orange-400" />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass panel-glow rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-2">
            {activities.slice(0, 6).map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-start gap-3 py-2 border-b border-cyan-500/5 last:border-0"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-xs text-cyan-200 font-medium truncate">{a.title}</p>
                  <p className="text-[10px] text-cyan-400/40 truncate">{a.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Priority Tasks Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass panel-glow rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              Priority Operations
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks
            .filter((t) => t.status !== "completed")
            .slice(0, 3)
            .map((task, i) => {
              const priorityColor = {
                critical: "text-red-400 bg-red-500/10 border-red-500/20",
                high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
                low: "text-green-400 bg-green-500/10 border-green-500/20",
              }[task.priority];
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.07 }}
                  className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-cyan-200 leading-tight">{task.title}</p>
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0", priorityColor)}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-[10px] text-cyan-400/50 line-clamp-2">{task.description}</p>
                  )}
                </motion.div>
              );
            })}
        </div>
      </motion.div>
    </div>
  );
}

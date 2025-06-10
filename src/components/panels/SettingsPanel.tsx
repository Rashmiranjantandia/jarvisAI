"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Key,
  Bot,
  Eye,
  EyeOff,
  Check,
  Cpu,
  RefreshCw,
  Info,
} from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { cn } from "@/lib/utils";
import type { AIProvider } from "@/lib/types";
import { ANTHROPIC_MODELS, OPENROUTER_MODELS } from "@/lib/types";
import { toast } from "sonner";

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="glass panel-glow rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-cyan-500/10">
        <Icon className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPanel() {
  const {
    aiProvider, aiModel, apiKey,
    setAIProvider, setAIModel, setApiKey,
    stats, sessions, tasks, notes,
  } = useJarvisStore();

  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const models = aiProvider === "anthropic" ? ANTHROPIC_MODELS : OPENROUTER_MODELS;

  const handleSaveKey = () => {
    setApiKey(keyInput.trim());
    setSaved(true);
    toast.success("API key saved.");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProviderChange = (provider: AIProvider) => {
    setAIProvider(provider);
    const defaultModels = provider === "anthropic" ? ANTHROPIC_MODELS : OPENROUTER_MODELS;
    setAIModel(defaultModels[1].id);
  };

  const handleReset = () => {
    if (confirm("Reset all JARVIS OS data? This cannot be undone.")) {
      localStorage.removeItem("jarvis-os-storage");
      window.location.reload();
    }
  };

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
            System Configuration
          </p>
          <h2 className="text-xl font-bold text-white">
            JARVIS <span className="neon-text">Settings</span>
          </h2>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Provider */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Section title="AI Provider" icon={Bot}>
            {/* Provider selector */}
            <div className="space-y-2">
              <label className="text-xs text-cyan-400/50 uppercase tracking-wider">Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {(["anthropic", "openrouter"] as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={cn(
                      "py-2.5 px-4 rounded-xl border text-sm font-medium transition-all",
                      aiProvider === p
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                        : "border-cyan-500/10 text-cyan-400/50 hover:border-cyan-500/20 hover:text-cyan-300"
                    )}
                  >
                    {p === "anthropic" ? "Anthropic" : "OpenRouter"}
                  </button>
                ))}
              </div>
            </div>

            {/* Model selector */}
            <div className="space-y-2">
              <label className="text-xs text-cyan-400/50 uppercase tracking-wider">Model</label>
              <div className="space-y-1.5">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setAIModel(m.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all",
                      aiModel === m.id
                        ? "bg-cyan-500/12 border-cyan-500/25 text-cyan-200"
                        : "border-cyan-500/8 text-cyan-400/50 hover:border-cyan-500/15 hover:text-cyan-300"
                    )}
                  >
                    <span className="font-mono text-xs">{m.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-cyan-400/40">{m.label}</span>
                      {aiModel === m.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Section>
        </motion.div>

        {/* API Key */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Section title="API Keys" icon={Key}>
            <div className="space-y-2">
              <label className="text-xs text-cyan-400/50 uppercase tracking-wider">
                {aiProvider === "anthropic" ? "Anthropic API Key" : "OpenRouter API Key"}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                    placeholder={aiProvider === "anthropic" ? "sk-ant-..." : "sk-or-..."}
                    className="w-full bg-cyan-500/5 border border-cyan-500/15 rounded-xl px-4 py-2.5 text-sm text-cyan-100 placeholder-cyan-400/20 focus:outline-none focus:border-cyan-500/35 transition-colors font-mono pr-10"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/30 hover:text-cyan-300 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveKey}
                  className={cn(
                    "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    saved
                      ? "bg-green-500/15 border-green-500/25 text-green-300"
                      : "bg-cyan-500/15 border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25"
                  )}
                >
                  {saved ? <Check className="w-4 h-4" /> : "Save"}
                </button>
              </div>
              <p className="text-[11px] text-cyan-400/30">
                Keys are stored locally in your browser only. Never transmitted except to the selected AI provider.
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
              <div className={cn("w-2 h-2 rounded-full", apiKey ? "bg-green-400 animate-pulse" : "bg-red-400/60")} />
              <span className={cn("text-xs font-medium", apiKey ? "text-green-300" : "text-red-300/60")}>
                {apiKey ? "API key configured — AI features active" : "No API key — AI features disabled"}
              </span>
            </div>

            {/* Quick links */}
            <div className="space-y-2">
              <p className="text-[11px] text-cyan-400/40 uppercase tracking-wider">Get API Keys</p>
              <div className="space-y-1.5">
                <a
                  href="https://console.anthropic.com/account/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-xs text-cyan-400/60 hover:text-cyan-300 hover:border-cyan-500/20 transition-all"
                >
                  Anthropic Console
                  <span className="text-[10px] opacity-50">console.anthropic.com →</span>
                </a>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-xs text-cyan-400/60 hover:text-cyan-300 hover:border-cyan-500/20 transition-all"
                >
                  OpenRouter Dashboard
                  <span className="text-[10px] opacity-50">openrouter.ai →</span>
                </a>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Section title="System Information" icon={Cpu}>
            <div className="space-y-3">
              {[
                { label: "Platform", value: "JARVIS OS v1.0" },
                { label: "Framework", value: "Next.js 14 App Router" },
                { label: "AI SDK", value: "@anthropic-ai/sdk ^0.27" },
                { label: "State", value: "Zustand + LocalStorage" },
                { label: "Sessions", value: String(sessions.length) },
                { label: "Tasks", value: String(tasks.length) },
                { label: "Notes", value: String(notes.length) },
                { label: "Uptime", value: `${stats.uptime} min` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-cyan-400/40">{item.label}</span>
                  <span className="text-xs font-mono text-cyan-300">{item.value}</span>
                </div>
              ))}
            </div>
          </Section>
        </motion.div>

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Section title="Data Management" icon={Info}>
            <div className="space-y-3">
              <p className="text-xs text-cyan-400/40 leading-relaxed">
                All JARVIS OS data is stored locally in your browser via localStorage. No data is sent to any server except AI provider API calls.
              </p>
              <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                <p className="text-xs text-yellow-400/60">
                  Sessions, tasks, notes, and settings persist across page reloads automatically.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400/60 text-sm hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reset All Data
              </button>
            </div>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}

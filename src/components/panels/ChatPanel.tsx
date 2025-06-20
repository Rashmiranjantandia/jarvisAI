"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatSession } from "@/lib/types";
import { ANTHROPIC_MODELS, OPENROUTER_MODELS } from "@/lib/types";
import { toast } from "sonner";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1 rounded text-cyan-400/40 hover:text-cyan-300 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
          isUser
            ? "bg-gradient-to-br from-cyan-500 to-blue-600"
            : "bg-gradient-to-br from-purple-500 to-cyan-600"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn("max-w-[75%] space-y-1", isUser && "items-end flex flex-col")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "bg-cyan-500/15 border border-cyan-500/20 text-cyan-100"
              : "glass border border-cyan-500/10 text-cyan-100"
          )}
        >
          {message.isStreaming && message.content === "" ? (
            <div className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          ) : (
            <div className={cn("prose prose-invert prose-sm max-w-none", message.isStreaming && "cursor-blink")}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    if (match) {
                      return (
                        <div className="relative group/code">
                          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
                            <CopyButton text={codeString} />
                          </div>
                          <SyntaxHighlighter
                            style={oneDark as Record<string, React.CSSProperties>}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              background: "rgba(0,10,25,0.8)",
                              border: "1px solid rgba(0,212,255,0.1)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    return (
                      <code
                        className="bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded text-[12px] font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp + copy */}
        <div className={cn("flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity", isUser && "flex-row-reverse")}>
          <span className="text-[10px] text-cyan-400/30 font-mono">
            {new Date(message.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
          {!isUser && <CopyButton text={message.content} />}
        </div>
      </div>
    </motion.div>
  );
}

function SessionItem({
  session,
  active,
  onSelect,
  onDelete,
}: {
  session: ChatSession;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
        active
          ? "bg-cyan-500/15 border border-cyan-500/20"
          : "hover:bg-cyan-500/8 border border-transparent"
      )}
      onClick={onSelect}
    >
      <MessageSquare className="w-3.5 h-3.5 text-cyan-400/50 flex-shrink-0" />
      <span className="text-xs text-cyan-300/70 truncate flex-1">{session.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-red-400/50 hover:text-red-400 transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function ChatPanel() {
  const {
    sessions,
    activeSessionId,
    createSession,
    deleteSession,
    setActiveSession,
    addMessage,
    updateMessage,
    finishStreaming,
    getActiveSession,
    aiProvider,
    aiModel,
    apiKey,
    addActivity,
    incrementStat,
  } = useJarvisStore();

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSessions, setShowSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeSession = getActiveSession();

  // Auto-scroll to latest message whenever the active session's message list changes.
  // Uses 'smooth' behavior so streaming responses feel natural and readable.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  const handleNewSession = useCallback(() => {
    createSession();
    setInput("");
  }, [createSession]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = createSession();
    }

    const userContent = input.trim();
    setInput("");
    setIsStreaming(true);

    addMessage(sessionId, { role: "user", content: userContent });

    const currentSession = useJarvisStore.getState().getActiveSession();
    const history = currentSession?.messages ?? [];

    const assistantMsgId = addMessage(sessionId, {
      role: "assistant",
      content: "",
      isStreaming: true,
    });

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userContent },
          ],
          provider: aiProvider,
          model: aiModel,
          apiKey,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                  updateMessage(sessionId!, assistantMsgId, accumulated);
                } else if (parsed.choices?.[0]?.delta?.content) {
                  accumulated += parsed.choices[0].delta.content;
                  updateMessage(sessionId!, assistantMsgId, accumulated);
                }
              } catch {}
            }
          }
        }
      }

      finishStreaming(sessionId!, assistantMsgId);
      incrementStat("messagesProcessed");
      addActivity({
        type: "chat",
        title: "AI Response Generated",
        description: userContent.slice(0, 60),
      });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        const errorMsg = err.message.includes("OpenRouter")
          ? err.message
          : `Error: ${err.message}`;
        finishStreaming(sessionId!, assistantMsgId);
        updateMessage(sessionId!, assistantMsgId, errorMsg);
        toast.error(err.message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [
    input, isStreaming, activeSessionId, createSession, addMessage,
    updateMessage, finishStreaming, aiProvider, aiModel, apiKey,
    addActivity, incrementStat,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sessions sidebar */}
      <AnimatePresence>
        {showSessions && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col h-full glass-strong border-r border-cyan-500/10 overflow-hidden flex-shrink-0"
          >
            <div className="p-3 border-b border-cyan-500/10 flex items-center justify-between">
              <span className="text-[11px] text-cyan-400/50 uppercase tracking-wider font-medium">
                Sessions
              </span>
              <button
                onClick={handleNewSession}
                className="p-1 rounded text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.length === 0 ? (
                <p className="text-[11px] text-cyan-400/30 text-center py-4">
                  No sessions yet
                </p>
              ) : (
                sessions.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    active={s.id === activeSessionId}
                    onSelect={() => setActiveSession(s.id)}
                    onDelete={() => deleteSession(s.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Chat toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/10 glass-strong flex-shrink-0">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="p-1.5 rounded text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
          >
            <ChevronDown
              className={cn("w-4 h-4 transition-transform", showSessions && "-rotate-90")}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-400/40 font-mono">
              {aiProvider.toUpperCase()} · {aiModel}
            </span>
            <button
              onClick={handleNewSession}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all border border-cyan-500/10"
            >
              <Plus className="w-3 h-3" />
              New
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center"
              >
                <Bot className="w-8 h-8 text-cyan-400" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-cyan-200 mb-1">JARVIS AI Interface</h2>
                <p className="text-sm text-cyan-400/40 max-w-xs">
                  {apiKey
                    ? "Ready. How can I assist you today, Director?"
                    : "Configure your API key in Settings to begin."}
                </p>
              </div>
              {!apiKey && (
                <div className="text-[11px] text-yellow-400/60 bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-4 py-2">
                  No API key configured — go to Settings → System Config
                </div>
              )}
            </div>
          ) : (
            activeSession.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-cyan-500/10 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 glass rounded-xl border border-cyan-500/15 focus-within:border-cyan-500/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask JARVIS anything... (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-sm text-cyan-100 placeholder-cyan-400/30 resize-none focus:outline-none max-h-32 overflow-y-auto"
                style={{ minHeight: "44px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className={cn(
                "p-3 rounded-xl transition-all flex-shrink-0",
                input.trim() && !isStreaming
                  ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 hover:shadow-neon-blue"
                  : "bg-cyan-500/5 border border-cyan-500/10 text-cyan-400/30 cursor-not-allowed"
              )}
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

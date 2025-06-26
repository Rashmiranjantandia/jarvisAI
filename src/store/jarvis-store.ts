"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  ChatSession,
  ChatMessage,
  Task,
  Note,
  ActivityItem,
  Notification,
  SystemStats,
  AIProvider,
  VoiceState,
} from "@/lib/types";

/**
 * JarvisStore — Centralized state management for JARVIS OS.
 *
 * All application state lives here. The store is split into domain slices:
 * UI, AI Provider, Chat, Tasks, Notes, Activity, Notifications, Voice, Stats.
 *
 * Persistence: selected domains are serialized to localStorage via Zustand
 * `persist` middleware. Transient state (UI, activity, notifications) is
 * intentionally excluded from persistence.
 */

interface JarvisStore {
  // UI State
  sidebarOpen: boolean;
  activePanel: string;
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: string) => void;

  // AI Provider
  aiProvider: AIProvider;
  aiModel: string;
  apiKey: string;
  setAIProvider: (provider: AIProvider) => void;
  setAIModel: (model: string) => void;
  setApiKey: (key: string) => void;

  // Chat
  sessions: ChatSession[];
  activeSessionId: string | null;
  createSession: () => string;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessage: (sessionId: string, messageId: string, content: string) => void;
  finishStreaming: (sessionId: string, messageId: string) => void;
  getActiveSession: () => ChatSession | null;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Activity Feed
  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Voice
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;

  // System Stats
  stats: SystemStats;
  incrementStat: (key: keyof SystemStats, amount?: number) => void;
}

export const useJarvisStore = create<JarvisStore>()(
  persist(
    (set, get) => ({
      // UI State — not persisted (always resets to dashboard on reload)
      sidebarOpen: true,
      activePanel: "dashboard",
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActivePanel: (panel) => set({ activePanel: panel }),

      // AI Provider
      aiProvider: "anthropic",
      aiModel: "claude-sonnet-4-6",
      apiKey: "",
      setAIProvider: (provider) => set({ aiProvider: provider }),
      setAIModel: (model) => set({ aiModel: model }),
      setApiKey: (key) => set({ apiKey: key }),

      // Chat \u2014 sessions are the core AI memory unit. Each session persists
      // its full message history to localStorage for cross-reload continuity.
      sessions: [],
      activeSessionId: null,
      createSession: () => {
        const id = uuidv4();
        const session: ChatSession = {
          id,
          title: "New Session",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          model: get().aiModel,
          provider: get().aiProvider,
        };
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: id,
        }));
        return id;
      },
      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId:
            state.activeSessionId === id
              ? state.sessions[0]?.id ?? null
              : state.activeSessionId,
        })),
      setActiveSession: (id) => set({ activeSessionId: id }),
      addMessage: (sessionId, message) => {
        const id = uuidv4();
        const newMessage: ChatMessage = {
          ...message,
          id,
          timestamp: new Date(),
        };
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, newMessage],
                  updatedAt: new Date(),
                  title:
                    s.messages.length === 0 && message.role === "user"
                      ? message.content.slice(0, 40)
                      : s.title,
                }
              : s
          ),
        }));
        return id;
      },
      updateMessage: (sessionId, messageId, content) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === messageId ? { ...m, content } : m
                  ),
                }
              : s
          ),
        })),
      finishStreaming: (sessionId, messageId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === messageId ? { ...m, isStreaming: false } : m
                  ),
                }
              : s
          ),
        })),
      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) ?? null;
      },

      // Tasks
      tasks: [
        {
          id: uuidv4(),
          title: "Review JARVIS OS architecture",
          description: "Analyze the new AI operating system structure",
          status: "in_progress",
          priority: "high",
          createdAt: new Date(),
          tags: ["ai", "architecture"],
        },
        {
          id: uuidv4(),
          title: "Configure AI provider API keys",
          description: "Add Anthropic and OpenRouter keys to .env.local",
          status: "pending",
          priority: "critical",
          createdAt: new Date(),
          tags: ["setup", "config"],
        },
        {
          id: uuidv4(),
          title: "Test voice recognition module",
          description: "Verify Web Speech API works across browsers",
          status: "pending",
          priority: "medium",
          createdAt: new Date(),
          tags: ["voice", "testing"],
        },
      ],
      addTask: (task) =>
        set((state) => ({
          tasks: [
            { ...task, id: uuidv4(), createdAt: new Date() },
            ...state.tasks,
          ],
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      // Notes
      notes: [
        {
          id: uuidv4(),
          title: "JARVIS System Notes",
          content: "Initial deployment notes for JARVIS OS v1.0. Configure API keys in `.env.local` to enable AI features.",
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ["system"],
          pinned: true,
        },
      ],
      addNote: (note) =>
        set((state) => ({
          notes: [
            { ...note, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() },
            ...state.notes,
          ],
        })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),

      // Activity
      activities: [
        {
          id: uuidv4(),
          type: "system",
          title: "JARVIS OS Initialized",
          description: "All systems nominal. Awaiting your command.",
          timestamp: new Date(),
        },
      ],
      addActivity: (activity) =>
        set((state) => ({
          activities: [
            { ...activity, id: uuidv4(), timestamp: new Date() },
            ...state.activities.slice(0, 49),
          ],
        })),

      // Notifications
      notifications: [
        {
          id: uuidv4(),
          type: "info",
          title: "Welcome to JARVIS OS",
          message: "Configure your API keys to unlock full AI capabilities.",
          timestamp: new Date(),
          read: false,
        },
      ],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            { ...notification, id: uuidv4(), timestamp: new Date(), read: false },
            ...state.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      // Voice
      voiceState: "idle",
      setVoiceState: (state) => set({ voiceState: state }),
      voiceEnabled: false,
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

      // Stats
      stats: {
        uptime: 0,
        messagesProcessed: 0,
        tasksCompleted: 0,
        voiceInteractions: 0,
        memoryUsage: 42,
      },
      incrementStat: (key, amount = 1) =>
        set((state) => ({
          stats: { ...state.stats, [key]: state.stats[key] + amount },
        })),
    }),
    {
      name: "jarvis-os-storage",
      storage: createJSONStorage(() => localStorage),
      // Optimized: only persist data that must survive page reloads.
      // UI state (activePanel, sidebarOpen) is intentionally excluded so
      // the app always starts at the dashboard, preventing stale panel state.
      // Storage size: ~50KB typical (dominated by chat session history).
      partialize: (state) => ({
        sessions: state.sessions,
        tasks: state.tasks,
        notes: state.notes,
        aiProvider: state.aiProvider,
        aiModel: state.aiModel,
        apiKey: state.apiKey,
        voiceEnabled: state.voiceEnabled,
        stats: state.stats,
      }),
    }
  )
);

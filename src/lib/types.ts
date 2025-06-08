export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  provider: "anthropic" | "openrouter";
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdAt: Date;
  tags: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  pinned: boolean;
}

export interface ActivityItem {
  id: string;
  type: "task" | "chat" | "note" | "system" | "voice";
  title: string;
  description: string;
  timestamp: Date;
  icon?: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface SystemStats {
  uptime: number;
  messagesProcessed: number;
  tasksCompleted: number;
  voiceInteractions: number;
  memoryUsage: number;
}

export type AIProvider = "anthropic" | "openrouter";
export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

export const ANTHROPIC_MODELS = [
  { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
] as const;

export const OPENROUTER_MODELS = [
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
  { id: "google/gemini-pro-1.5", label: "Gemini Pro 1.5" },
] as const;

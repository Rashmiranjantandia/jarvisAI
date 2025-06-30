# JARVIS OS — Architecture Documentation

## Overview

JARVIS OS is a single-page Next.js application structured as a panel-based operating system dashboard. All state is centralized in a single Zustand store with localStorage persistence.

---

## Application Shell

```
src/app/page.tsx  (Root client component)
    │
    ├── Sidebar.tsx         (Navigation — panel switching)
    ├── Navbar.tsx          (Top bar — clock, voice, notifications)
    └── ActivePanel         (Dynamic — one panel rendered at a time)
```

`page.tsx` uses `next/dynamic` with `ssr: false` for all heavy panels to avoid hydration issues with Web Speech API and localStorage.

---

## Panel Architecture

Each panel is a self-contained client component that reads from and writes to the Zustand store. Panels do not communicate directly with each other — all data flows through the store.

```
panels/
├── DashboardPanel.tsx   — Command Center: stats grid, system monitor, activity preview
├── ChatPanel.tsx        — AI conversation: sessions sidebar, streaming messages, input
├── VoicePanel.tsx       — Voice: orb UI, speech recognition, clap detection, TTS
├── TasksPanel.tsx       — Operations: task CRUD, priority, filtering, status tracking
├── NotesPanel.tsx       — Intelligence Notes: markdown editor, tags, pin support
├── ActivityPanel.tsx    — Activity Feed: real-time log of all system events
├── MemoryPanel.tsx      — AI Memory: searchable session browser
└── SettingsPanel.tsx    — System Config: API keys, model selection, system info
```

---

## State Management

All application state lives in `src/store/jarvis-store.ts` — a single Zustand store with `persist` middleware.

### State Domains

| Domain | State | Persisted |
|---|---|---|
| UI | `sidebarOpen`, `activePanel` | ❌ |
| AI Provider | `aiProvider`, `aiModel`, `apiKey` | ✅ |
| Chat | `sessions`, `activeSessionId` | ✅ |
| Tasks | `tasks[]` | ✅ |
| Notes | `notes[]` | ✅ |
| Activity | `activities[]` | ❌ |
| Notifications | `notifications[]` | ❌ |
| Voice | `voiceState`, `voiceEnabled` | ✅ |
| Stats | `stats` (uptime, messages, etc.) | ✅ |

Persisted state is saved to `localStorage` under the key `jarvis-os-storage`.

---

## AI Integration

### Streaming Architecture

```
Client (ChatPanel.tsx)
    │
    ├── POST /api/chat  →  route.ts
    │       │
    │       ├── Anthropic SDK  →  client.messages.stream()
    │       │       └── Server-Sent Events stream → client
    │       │
    │       └── OpenRouter API  →  fetch() with stream: true
    │               └── Raw SSE stream passed through → client
    │
    └── ReadableStream reader  →  accumulates chunks  →  updateMessage()
```

Both providers return `data: {"text": "..."}` SSE chunks terminated with `data: [DONE]`.

### JARVIS System Prompt

All AI requests include the JARVIS persona prompt, injected as:
- `system:` parameter (Anthropic)
- First message with `role: "system"` (OpenRouter)

The persona instruction shapes JARVIS to be an elite, concise AI copilot rather than a generic chatbot. It emphasizes strategic thinking, code expertise, and premium response quality.

> *"You are JARVIS — an advanced AI operating system. You are intelligent, concise, and premium. Your personality: elite executive AI copilot, strategic thinking, subtle wit, calm confidence."*

---

## Voice System

### Speech Recognition Flow

```
User speaks  →  SpeechRecognition.onresult  →  handleUserInput()
                                                    │
                                                    ├── Command routing (keyword match)
                                                    ├── addActivity()
                                                    └── speak()  →  SpeechSynthesisUtterance
```

### Clap Detection Flow

```
getUserMedia()  →  AudioContext  →  AnalyserNode (fftSize=512)
                                        │
                                    setInterval(30ms)
                                        │
                                    getByteFrequencyData()
                                        │
                                    Peak analysis → 5 guards
                                        │
                                    Double-clap confirmed
                                        │
                                    buildContextSummary() → speak()
```

---

## Data Flow Diagram

```
User Action
    │
    ▼
Panel Component  ──read──→  Zustand Store ──persist──→  localStorage
    │                           │
    │                           └──write── addActivity / addNotification
    │
    ▼
API Route (streaming)
    │
    ▼
AI Provider (Anthropic / OpenRouter)
    │
    ▼
SSE Stream → updateMessage() → re-render
```

---

## Performance Notes

- Heavy panels use `next/dynamic` with `ssr: false` — loaded on first navigation
- Framer Motion `AnimatePresence` with `mode="wait"` for panel transitions
- Activity feed capped at 50 items to prevent unbounded growth
- Clap detection uses 30ms interval with `requestAnimationFrame`-style waveform updates at 60ms

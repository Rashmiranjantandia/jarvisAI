<div align="center">

# ⚡ JARVIS OS

### Futuristic AI Assistant Dashboard

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss)
![Zustand](https://img.shields.io/badge/Zustand-4-orange?style=for-the-badge)

*A JARVIS-inspired AI operating system dashboard with real-time voice interaction, clap detection, AI chat, memory persistence, activity tracking, and task management.*

</div>

---

## 📸 Screenshots

> *Dashboard in action — Command Center, Voice Interface, and AI Chat panels*

| Command Center | AI Chat | Voice Interface |
|---|---|---|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

---

## ✨ Features

- **🤖 AI Chat** — Streaming conversations via Anthropic Claude or OpenRouter (GPT-4o, Llama, Gemini)
- **🎙️ Voice Interface** — Web Speech API recognition with text-to-speech JARVIS responses
- **👏 Clap Detection** — Double-clap microphone activation using Web Audio API analyser
- **🧠 AI Memory** — Persistent conversation sessions stored in localStorage
- **📋 Task Management** — Operations center with priority filtering and completion tracking
- **📝 Intelligence Notes** — Taggable notes editor with pin support
- **📊 Activity Feed** — Real-time log of AI interactions, voice commands, and task events
- **🔔 Notifications** — In-app notification bell with unread badge
- **⏱️ Live System Stats** — Uptime, messages processed, tasks completed, memory usage
- **⚙️ System Config** — API key management, model selection, data reset

---

## 🏗️ Architecture Overview

```
jarvis-os/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout — fonts, Toaster, dark mode
│   │   ├── page.tsx            # Main entry — panel router, sidebar + navbar
│   │   ├── globals.css         # Global CSS — glass, neon, hud-grid utilities
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts    # Streaming AI API — Anthropic + OpenRouter
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     # Collapsible nav sidebar with glowing indicators
│   │   │   └── Navbar.tsx      # Top bar — clock, voice toggle, notifications
│   │   └── panels/
│   │       ├── DashboardPanel.tsx   # Command center — stats, system monitor
│   │       ├── ChatPanel.tsx        # AI conversation with streaming rendering
│   │       ├── VoicePanel.tsx       # Voice + clap detection + waveform
│   │       ├── TasksPanel.tsx       # Task management with filters
│   │       ├── NotesPanel.tsx       # Intelligence notes with tagging
│   │       ├── ActivityPanel.tsx    # Real-time activity feed
│   │       ├── MemoryPanel.tsx      # AI session memory browser
│   │       └── SettingsPanel.tsx    # API keys, model selection, system info
│   ├── store/
│   │   └── jarvis-store.ts     # Zustand store — all state + localStorage persistence
│   └── lib/
│       ├── types.ts            # Shared TypeScript interfaces and model constants
│       └── utils.ts            # cn(), formatTime(), formatDate(), utilities
├── tailwind.config.ts          # Neon HUD design system — JARVIS color palette
├── tsconfig.json               # TypeScript strict mode config
└── next.config.mjs             # Next.js config — Anthropic SDK externals
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3 + custom neon utilities |
| Animation | Framer Motion |
| State | Zustand 4 + localStorage persistence |
| AI (primary) | Anthropic Claude (via `@anthropic-ai/sdk`) |
| AI (secondary) | OpenRouter (GPT-4o, Llama 3.1, Gemini Pro) |
| Voice Input | Web Speech API (`SpeechRecognition`) |
| Voice Output | Web Speech Synthesis API |
| Clap Detection | Web Audio API (`AudioContext`, `AnalyserNode`) |
| Markdown | `react-markdown` + `remark-gfm` + `react-syntax-highlighter` |
| UI Components | Radix UI primitives |
| Notifications | Sonner toast |
| Icons | Lucide React |

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Chrome or Edge browser (for voice features)

### Setup

```bash
# Clone the repository
git clone https://github.com/Rashmiranjantandia/jarvisAI.git
cd jarvisAI

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your API keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local`:

```env
# Required: at least one AI provider key
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENROUTER_API_KEY=sk-or-your-key-here

# App config (optional)
NEXT_PUBLIC_APP_NAME=JARVIS OS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

> **Note:** `.env.local` is gitignored and never committed. Keys are also stored client-side in localStorage for the AI chat panel.

---

## 🤖 OpenRouter Setup

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create a free account and generate an API key
3. Add to `.env.local` as `OPENROUTER_API_KEY`
4. In the app, go to **Settings → AI Provider → OpenRouter**
5. Select your preferred model (GPT-4o, Llama 3.1 70B, or Gemini Pro 1.5)

OpenRouter gives access to 100+ models through a single API key.

---

## 🎙️ Voice System

The voice system uses two browser APIs:

**Speech Recognition** (`SpeechRecognition` / `webkitSpeechRecognition`):
- Listens for spoken commands
- Routes to panel navigation or JARVIS responses
- Requires Chrome or Edge (Firefox not supported)

**Speech Synthesis** (`SpeechSynthesis`):
- JARVIS responds with text-to-speech
- Prefers deep male voices (David/Guy) if available
- Rate: 0.95, Pitch: 1.0, Volume: 0.9

### Supported Voice Commands
| Command | Action |
|---|---|
| "Open dashboard" | Navigate to Command Center |
| "Open chat" | Navigate to AI Chat |
| "Show tasks" | Navigate to Operations |
| "Daily briefing" | JARVIS reads system summary |
| "What time is it" | Current time response |
| "Open notes" | Navigate to Intelligence Notes |
| "Open settings" | Navigate to System Config |
| "Open memory" | Navigate to AI Memory |

---

## 👏 Clap Detection

The clap detection system uses `AudioContext` + `AnalyserNode` to detect double-clap patterns:

**How it works:**
1. Requests microphone permission via `getUserMedia`
2. Creates an `AnalyserNode` with `fftSize=512` for frequency analysis
3. Runs a 30ms detection loop measuring peak amplitude
4. Validates clap events with 5 guards:
   - **Guard 1:** AudioContext not suspended
   - **Guard 2:** 3-second post-activation cooldown
   - **Guard 3:** TTS speaking lock (prevents mic picking up JARVIS voice)
   - **Guard 4:** Sharpness test (rise ≥ 30 per 30ms tick)
   - **Guard 5:** Silence gap ≥ 80ms before event

**Double-clap timing:** Two claps detected 150ms–900ms apart triggers activation.

### Known Limitations

- **Tab must be active:** Browser suspends `AudioContext` when tab is hidden. Click anywhere to resume.
- **Noisy environments:** Use Auto-Calibrate to measure ambient noise floor before use.
- **Chrome/Edge only:** Firefox does not support `webkitSpeechRecognition`.
- **HTTPS required in production:** Microphone access requires secure context.

---

## 🌐 Browser Limitations

| Feature | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| AI Chat | ✅ | ✅ | ✅ | ✅ |
| Voice Recognition | ✅ | ✅ | ❌ | ❌ |
| Text-to-Speech | ✅ | ✅ | ✅ | ✅ |
| Clap Detection | ✅ | ✅ | ✅ | ✅ |

---

## 🗺️ Future Roadmap

- [ ] **Plugin System** — Custom JARVIS skill modules
- [ ] **Multi-user Support** — Authentication and user profiles  
- [ ] **Cloud Sync** — Optional session backup to cloud storage
- [ ] **Calendar Integration** — Google Calendar awareness in briefings
- [ ] **Code Execution** — Sandboxed code runner in AI chat
- [ ] **File Upload** — Document analysis and summarization
- [ ] **Mobile App** — React Native companion app
- [ ] **Custom Wake Word** — Trainable wake word instead of double-clap
- [ ] **Webhook Support** — Trigger external automations via voice

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

### Self-Hosted

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

> **Important:** Add your environment variables to your hosting platform. Never commit `.env.local`.

---

## ⚠️ Known Issues

1. **Double speech on voice activation** — Fixed with `isSpeakingRef` guard; if TTS fires twice, check microphone gain levels.
2. **Clap detection suspended after Alt+Tab** — Click anywhere in the browser tab to resume `AudioContext`.
3. **Session data lost on private browsing** — localStorage is cleared when private browsing sessions end.
4. **Streaming stops on slow connections** — Increase server timeout; OpenRouter has a 60s limit.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: your feature description"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow conventional commit format: `type(scope): description`

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ⚡ by [Rashmiranjan Tandia](https://github.com/Rashmiranjantandia)

*"Sometimes you gotta run before you can walk." — Tony Stark*

</div>

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  AlertCircle,
  Hand,
  MessageSquare,
  Settings2,
  BarChart2,
} from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Type declarations for Web Speech API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface ISpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface ISpeechRecognitionErrorEvent {
  error: string;
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: ISpeechRecognitionConstructor;
    webkitSpeechRecognition: ISpeechRecognitionConstructor;
  }
}

type SpeechRecognitionEvent = ISpeechRecognitionEvent;
type SpeechRecognitionErrorEvent = ISpeechRecognitionErrorEvent;

function VoiceOrb({ state }: { state: "idle" | "listening" | "processing" | "speaking" }) {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Outer rings */}
      {state !== "idle" && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/15"
            animate={{ scale: [1, 1.6, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
        </>
      )}

      {/* Core orb */}
      <motion.div
        className={cn(
          "w-32 h-32 rounded-full flex items-center justify-center relative overflow-hidden",
          state === "idle" && "bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20",
          state === "listening" && "bg-gradient-to-br from-cyan-500/25 to-blue-600/25 border border-cyan-400/50",
          state === "processing" && "bg-gradient-to-br from-purple-500/25 to-cyan-600/25 border border-purple-400/50",
          state === "speaking" && "bg-gradient-to-br from-green-500/25 to-cyan-600/25 border border-green-400/50"
        )}
        animate={
          state === "listening"
            ? { scale: [1, 1.05, 1], boxShadow: ["0 0 20px rgba(0,212,255,0.2)", "0 0 40px rgba(0,212,255,0.5)", "0 0 20px rgba(0,212,255,0.2)"] }
            : state === "speaking"
            ? { scale: [1, 1.04, 1] }
            : {}
        }
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Icon */}
        {state === "idle" && <Mic className="w-10 h-10 text-cyan-400/50" />}
        {state === "listening" && (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <Mic className="w-10 h-10 text-cyan-300" />
          </motion.div>
        )}
        {state === "processing" && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-10 h-10 text-purple-300" />
          </motion.div>
        )}
        {state === "speaking" && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Volume2 className="w-10 h-10 text-green-300" />
          </motion.div>
        )}

        {/* Listening waveform overlay */}
        {state === "listening" && (
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 h-10 pb-2 px-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-cyan-400 rounded-full"
                animate={{ height: [3, Math.random() * 20 + 5, 3] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

const STATE_LABELS = {
  idle: "Ready — Click to activate",
  listening: "Listening...",
  processing: "Processing...",
  speaking: "Speaking...",
};

const STATE_COLORS = {
  idle: "text-cyan-400/50",
  listening: "text-cyan-300",
  processing: "text-purple-300",
  speaking: "text-green-300",
};

export default function VoicePanel() {
  const {
    voiceState,
    setVoiceState,
    addActivity,
    addNotification,
    tasks,
    sessions,
    incrementStat,
  } = useJarvisStore();

  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<Array<{ type: "user" | "jarvis"; text: string }>>([]);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [supported, setSupported] = useState(true);
  const [clapEnabled, setClapEnabled] = useState(false);

  // Clap detection state
  const [clapSensitivity, setClapSensitivity] = useState(75); // threshold 0–255, lower = more sensitive
  const [showClapDebug, setShowClapDebug] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [micLevel, setMicLevel] = useState(0);           // 0–255 smoothed amplitude for display
  const [noiseFloor, setNoiseFloor] = useState(35);       // ambient noise baseline — raised from 20
  const [lastClapAt, setLastClapAt] = useState<number | null>(null);
  const [clapDebugLog, setClapDebugLog] = useState<string[]>([]);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(0));
  const [contextSuspended, setContextSuspended] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const clapDetectRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const noiseFloorRef = useRef(35);
  const sensitivityRef = useRef(75);
  // Clap state stored in refs so setInterval closure always reads latest values
  const lastClapTimeRef = useRef(0);
  const clapCountRef = useRef(0);
  const inClapWindowRef = useRef(false); // true = we are inside a single sound event (debounce)
  const buildContextSummaryRef = useRef<() => string>(() => "");
  const speakRef = useRef<(t: string) => void>(() => {});
  // ── New stabilization refs ────────────────────────────────────────────────
  // isSpeakingRef: true while TTS is active — blocks detection loop so mic
  //   doesn't pick up JARVIS voice output and trigger a false second clap.
  const isSpeakingRef = useRef(false);
  // prevPeakRef: peak from the last 30ms tick — used to measure attack speed.
  //   A real clap rises by ≥30 in one tick; ambient noise rises gradually.
  const prevPeakRef = useRef(0);
  // smoothedPeakRef: exponential moving average of raw peak (α=0.3).
  //   Used for the UI meter only — keeps the bar visually stable.
  const smoothedPeakRef = useRef(0);
  // lastSilentTimeRef: last timestamp when amplitude was BELOW threshold.
  //   First clap only registered if silence lasted ≥80ms — filters sustained hum.
  const lastSilentTimeRef = useRef(Date.now());
  // activationCooldownRef: timestamp of last successful activation.
  //   Detection is fully suppressed for 3000ms after activation fires,
  //   preventing TTS audio from triggering a second activation.
  const activationCooldownRef = useRef(0);

  useEffect(() => {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSupported(false);
      return;
    }
    synthRef.current = window.speechSynthesis;

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      setTranscript(final || interim);
      if (final) {
        handleUserInput(final);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error(`Speech recognition error: ${e.error}`);
      }
      setVoiceState("idle");
    };

    rec.onend = () => {
      if (voiceState === "listening") {
        setVoiceState("idle");
      }
    };

    recognitionRef.current = rec;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Prefer a deep male voice if available
    const voices = synthRef.current.getVoices();
    const preferred =
      voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("david")) ||
      voices.find((v) => v.lang === "en-US" && (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("guy"))) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      // Lock: while TTS is playing, mic must not detect claps.
      // Without this, speaker output reaches the mic and triggers a
      // second activation immediately after the first.
      isSpeakingRef.current = true;
      setVoiceState("speaking");
    };
    utterance.onend = () => {
      // Unlock: TTS finished, safe to resume clap detection.
      isSpeakingRef.current = false;
      setVoiceState("idle");
    };
    utterance.onerror = () => {
      // Also unlock on error to prevent permanent lock
      isSpeakingRef.current = false;
      setVoiceState("idle");
    };
    synthRef.current.speak(utterance);
  }, [ttsEnabled, setVoiceState]);

  const buildContextSummary = useCallback(() => {
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const totalSessions = sessions.length;
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return `${greeting}, Director. Systems are online. You have ${pending} pending task${pending !== 1 ? "s" : ""} and ${inProgress} in progress. ${totalSessions} AI session${totalSessions !== 1 ? "s" : ""} on record. How can I assist you?`;
  }, [tasks, sessions]);

  // Keep refs current so clap setInterval closure always has fresh callbacks
  useEffect(() => {
    buildContextSummaryRef.current = buildContextSummary;
  }, [buildContextSummary]);

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  useEffect(() => {
    sensitivityRef.current = clapSensitivity;
  }, [clapSensitivity]);

  // Resume suspended AudioContext when tab regains focus.
  // Browsers automatically suspend AudioContext when the tab is hidden
  // (to conserve battery/CPU). We must call .resume() to restart clap detection.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && audioCtxRef.current) {
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume().then(() => {
            setContextSuspended(false);
            console.log("[JARVIS AudioCtx] Resumed after tab became visible");
          });
        }
      } else if (document.visibilityState === "hidden" && audioCtxRef.current) {
        if (audioCtxRef.current.state === "suspended" || audioCtxRef.current.state === "running") {
          setContextSuspended(true);
          console.log("[JARVIS AudioCtx] Tab hidden — browser may suspend AudioContext");
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleUserInput = useCallback((input: string) => {
    setVoiceState("processing");
    const lower = input.toLowerCase().trim();
    let responseText = "";

    setHistory((prev) => [...prev, { type: "user", text: input }]);

    // Command routing
    if (lower.includes("dashboard") || lower.includes("home")) {
      responseText = "Navigating to the Command Center.";
    } else if (lower.includes("chat") || lower.includes("ai")) {
      responseText = "Opening the AI Chat interface.";
    } else if (
      lower.includes("task") ||
      lower.includes("operation") ||
      lower.includes("pending")
    ) {
      const pending = tasks.filter((t) => t.status === "pending").length;
      responseText = `You currently have ${pending} pending task${pending !== 1 ? "s" : ""}. Shall I open the Operations panel?`;
    } else if (lower.includes("summar") || lower.includes("briefing") || lower.includes("update")) {
      responseText = buildContextSummary();
    } else if (lower.includes("hello") || lower.includes("hey") || lower.includes("hi")) {
      responseText = "Hello, Director. All systems nominal. What do you need?";
    } else if (lower.includes("time")) {
      const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      responseText = `The current time is ${t}.`;
    } else if (lower.includes("note")) {
      responseText = "Opening Intelligence Notes.";
    } else if (lower.includes("setting") || lower.includes("config")) {
      responseText = "Opening System Configuration.";
    } else if (lower.includes("memory")) {
      responseText = "Opening AI Memory panel.";
    } else if (lower.includes("activity") || lower.includes("log")) {
      responseText = "Opening Activity Feed.";
    } else {
      responseText = `I heard: "${input}". For complex queries, use the AI Chat panel for full language model capabilities.`;
    }

    setHistory((prev) => [...prev, { type: "jarvis", text: responseText }]);

    setTimeout(() => {
      speak(responseText);
      incrementStat("voiceInteractions");
      addActivity({ type: "voice", title: "Voice Command", description: input.slice(0, 60) });
    }, 300);
  }, [tasks, buildContextSummary, speak, incrementStat, addActivity, setVoiceState]);

  const toggleListening = useCallback(() => {
    if (!supported) {
      toast.error("Web Speech API not supported in this browser.");
      return;
    }
    if (voiceState === "listening") {
      recognitionRef.current?.stop();
      setVoiceState("idle");
    } else {
      setTranscript("");
      setVoiceState("listening");
      try {
        recognitionRef.current?.start();
      } catch {
        setVoiceState("idle");
      }
    }
  }, [supported, voiceState, setVoiceState]);

  // ─── Calibration mode ───────────────────────────────────────────────────────
  // Measures ambient noise floor over 3 seconds, then sets noiseFloor baseline.
  const runCalibration = useCallback(async () => {
    if (!analyserRef.current) {
      toast.error("Start clap detection first, then calibrate.");
      return;
    }
    setCalibrating(true);
    console.log("[JARVIS Clap] Calibration started — measuring ambient noise for 3 seconds");
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const samples: number[] = [];
    const startTime = Date.now();

    const sampleInterval = setInterval(() => {
      analyser.getByteFrequencyData(data);
      let peak = 0;
      for (let i = 0; i < data.length; i++) { if (data[i] > peak) peak = data[i]; }
      samples.push(peak);
      if (Date.now() - startTime >= 3000) {
        clearInterval(sampleInterval);
        // Use 90th percentile as noise floor so occasional sounds don't inflate it
        samples.sort((a, b) => a - b);
        const p90 = samples[Math.floor(samples.length * 0.9)];
        const newFloor = Math.max(p90, 10); // minimum 10
        noiseFloorRef.current = newFloor;
        setNoiseFloor(newFloor);
        // Auto-set sensitivity: noise floor + 25 headroom
        const newSensitivity = Math.min(newFloor + 25, 200);
        sensitivityRef.current = newSensitivity;
        setClapSensitivity(newSensitivity);
        setCalibrating(false);
        console.log(`[JARVIS Clap] Calibration complete. Noise floor: ${newFloor}, Threshold set to: ${newSensitivity}`);
        toast.success(`Calibration complete — noise floor: ${newFloor}, threshold: ${newSensitivity}`);
      }
    }, 50);
  }, []);

  // ─── Clap Detection Engine ───────────────────────────────────────────────────
  //
  // Algorithm: Peak-based transient detection with 5-guard debounce system.
  //
  // Each 30ms tick reads max frequency bin from AnalyserNode (fftSize=512).
  // Guards prevent false positives from sustained noise, TTS feedback, and
  // tab-switch AudioContext suspension.
  //
  // Double-clap state machine:
  //   Silent → Clap1 → (150–900ms window) → Clap2 → ACTIVATION
  //   A gap > 900ms resets the sequence back to Silent.
  //
  // Improvements vs naive threshold detection:
  //   • Peak (max bin) instead of average — claps are broadband spikes
  //   • Attack speed test (rise ≥ 30) — filters gradual ambient noise
  //   • Silence gap test (≥ 80ms) — filters oscillating sustained noise
  //   • 3-second post-activation cooldown — prevents TTS mic-pickup loops
  //   • isSpeakingRef lock — blocks detection while JARVIS is speaking
  const toggleClapDetection = useCallback(async () => {
    if (clapEnabled) {
      clapDetectRef.current && clearInterval(clapDetectRef.current);
      waveformRef.current && clearInterval(waveformRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      setClapEnabled(false);
      setMicLevel(0);
      setWaveformBars(Array(24).fill(0));
      console.log("[JARVIS Clap] Detection stopped");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      // fftSize 512 gives 256 frequency bins — better resolution than 256/128
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.15; // low smoothing = faster transient capture for claps
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);

      // Reset clap state
      lastClapTimeRef.current = 0;
      clapCountRef.current = 0;
      inClapWindowRef.current = false;
      prevPeakRef.current = 0;
      smoothedPeakRef.current = 0;
      lastSilentTimeRef.current = Date.now(); // start as "silent" so first clap needs silence preceding it
      activationCooldownRef.current = 0;
      isSpeakingRef.current = false;

      console.log(`[JARVIS Clap] Detection started. fftSize=512, bins=${analyser.frequencyBinCount}, threshold=${noiseFloorRef.current + sensitivityRef.current}`);

      // ── Main detection loop (every 30ms for faster transient capture) ──────
      clapDetectRef.current = setInterval(() => {
        // ── Guard 1: AudioContext suspension (tab switch, screen dim) ────────
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
          setContextSuspended(true);
          return;
        }
        setContextSuspended(false);

        // ── Guard 2: Post-activation cooldown (3s immunity after each fire) ──
        // This prevents TTS voice output from being picked up by mic and
        // triggering a second/third activation right after the first one.
        const now = Date.now();
        if (now - activationCooldownRef.current < 3000) return;

        // ── Guard 3: Speaking lock ────────────────────────────────────────────
        // isSpeakingRef is set true in utterance.onstart and false in onend.
        // While JARVIS is speaking, the mic hears the speaker output — skip all
        // detection to prevent acoustic feedback from triggering a second clap.
        if (isSpeakingRef.current) return;

        // ── Audio analysis ────────────────────────────────────────────────────
        analyser.getByteFrequencyData(freqData);

        // Raw peak: max bin value across all frequency bins.
        // Claps are broadband transients — they spike all bins simultaneously.
        let peak = 0;
        for (let i = 0; i < freqData.length; i++) { if (freqData[i] > peak) peak = freqData[i]; }

        // Attack speed: how fast did amplitude rise since last tick?
        // A real hand clap rises by ≥30 counts in one 30ms tick.
        // Sustained noise (fan, voice, hum) rises slowly — typically <15 per tick.
        const rise = peak - prevPeakRef.current;
        prevPeakRef.current = peak;

        // Smoothed peak for UI display only (exponential moving average α=0.3).
        // Formula: smoothed = smoothed * 0.7 + peak * 0.3
        // Keeps the amplitude meter visually stable without affecting detection logic.
        smoothedPeakRef.current = smoothedPeakRef.current * 0.7 + peak * 0.3;
        setMicLevel(Math.round(smoothedPeakRef.current));

        const threshold = noiseFloorRef.current + sensitivityRef.current;
        const gap = now - lastClapTimeRef.current;

        if (peak > threshold) {
          if (!inClapWindowRef.current) {
            // Leading edge of a potential clap event.
            // Before registering anything, validate it is a transient:

            // ── Guard 4: Sharpness test ────────────────────────────────────────
            // rise < 30 means this amplitude increase is too gradual to be a clap.
            // Rejects: fan ramp-up, speech onset, sustained hum crossing threshold.
            if (rise < 30) {
              // Not sharp enough — update silence tracker and skip
              // (don't set inClapWindowRef so we re-check every tick)
              return;
            }

            // ── Guard 5: Silence gap test ─────────────────────────────────────
            // We only count a clap if amplitude was below threshold for ≥80ms
            // immediately before this event. This rejects sustained noise that
            // oscillates above/below threshold rapidly (which would keep firing).
            const silenceDuration = now - lastSilentTimeRef.current;
            if (silenceDuration < 80) return;

            // All guards passed — this is a valid clap candidate.
            inClapWindowRef.current = true;

            if (gap > 150 && gap < 900 && lastClapTimeRef.current !== 0) {
              // ── Second clap of a double-clap sequence ───────────────────────
              clapCountRef.current += 1;
              console.log(`[JARVIS Clap] Clap 2 detected. peak=${peak} rise=${rise} threshold=${threshold} gap=${gap}ms`);

              if (clapCountRef.current >= 1) {
                // Double clap confirmed. Reset all clap state immediately.
                clapCountRef.current = 0;
                lastClapTimeRef.current = 0;
                inClapWindowRef.current = false;
                activationCooldownRef.current = now; // start 3s immunity window

                const msg = buildContextSummaryRef.current();
                console.log(`[JARVIS Clap] ✓ ACTIVATED — peak=${peak} rise=${rise}`);
                setClapDebugLog((prev) => [
                  `${new Date().toLocaleTimeString()} ✓ ACTIVATED — peak ${peak} rise ${rise}`,
                  ...prev.slice(0, 19),
                ]);
                setLastClapAt(now);
                setHistory((prev) => [
                  ...prev,
                  { type: "jarvis", text: "Double clap detected. " + msg },
                ]);
                speakRef.current(msg);
                addNotification({
                  type: "info",
                  title: "JARVIS Activated",
                  message: "Double clap detected.",
                });
              }
            } else if (lastClapTimeRef.current === 0 || gap >= 900) {
              // ── First clap (or gap expired — treat as new sequence) ─────────
              clapCountRef.current = 0;
              lastClapTimeRef.current = now;
              console.log(`[JARVIS Clap] Clap 1 registered. peak=${peak} rise=${rise} threshold=${threshold}`);
              setClapDebugLog((prev) => [
                `${new Date().toLocaleTimeString()} Clap 1 — peak ${peak} rise ${rise} thr ${threshold}`,
                ...prev.slice(0, 19),
              ]);
            }
          }
          // else: still inside the same clap event window — skip until amplitude drops
          // This prevents a single clap from being counted multiple times across
          // consecutive 30ms ticks where amplitude stays above threshold.
        } else {
          // Amplitude is below threshold.
          if (inClapWindowRef.current) {
            // Clap event just ended — re-arm debounce for next event.
            inClapWindowRef.current = false;
          }
          // Track the last time we were silent (for Guard 5 above).
          lastSilentTimeRef.current = now;
          // Auto-reset first clap if too much time has passed (>900ms = sequence abandoned).
          if (lastClapTimeRef.current !== 0 && gap > 900) {
            clapCountRef.current = 0;
            lastClapTimeRef.current = 0;
          }
        }
      }, 30);

      // ── Waveform visualization loop (every 60ms — visual only) ─────────────
      // Reads time-domain data (waveform) rather than frequency data for a
      // more natural-looking audio visualizer. Samples 24 evenly-spaced points
      // and converts to absolute deviation from the centre (128) so silence = 0.
      waveformRef.current = setInterval(() => {
        if (audioCtx.state !== "running") return;
        analyser.getByteTimeDomainData(timeData);
        const step = Math.floor(timeData.length / 24);
        const bars = Array.from({ length: 24 }, (_, i) => {
          const val = timeData[i * step] ?? 128;
          return Math.abs(val - 128); // centre around 0, range 0–128
        });
        setWaveformBars(bars);
      }, 60);

      setClapEnabled(true);
      toast.success("Clap detection active — double-clap to activate JARVIS");
      console.log("[JARVIS Clap] Ready. Double-clap within 900ms to trigger.");
    } catch {
      toast.error("Microphone access denied for clap detection.");
      console.error("[JARVIS Clap] getUserMedia failed — mic permission denied");
    }
  }, [clapEnabled, addNotification]);

  // Cleanup on unmount — stop all audio processing and release microphone.
  // Critical: failing to stop the MediaStream keeps the browser mic indicator
  // active and prevents other apps from accessing the microphone.
  useEffect(() => {
    return () => {
      clapDetectRef.current && clearInterval(clapDetectRef.current);
      waveformRef.current && clearInterval(waveformRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass panel-glow rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 hud-grid opacity-30" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-cyan-400/50 uppercase tracking-[0.2em] mb-1">
              Voice Interface
            </p>
            <h2 className="text-xl font-bold text-white">
              JARVIS Voice <span className="neon-text">Command</span> System
            </h2>
            <p className="text-sm text-cyan-400/50 mt-1">
              Web Speech API — Chrome/Edge required · Clap detection is tab-active only
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={cn(
                "p-2 rounded-lg transition-all border",
                ttsEnabled
                  ? "bg-green-500/15 border-green-500/20 text-green-300"
                  : "bg-cyan-500/5 border-cyan-500/10 text-cyan-400/40"
              )}
              title={ttsEnabled ? "Disable TTS" : "Enable TTS"}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

      {!supported && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">
              Web Speech API not supported
            </p>
            <p className="text-xs text-red-400/60 mt-0.5">
              Use Chrome or Edge for voice features. Transcript/response display still works.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orb + controls */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass panel-glow rounded-2xl p-8 flex flex-col items-center gap-6"
        >
          <VoiceOrb state={voiceState} />

          <div className="text-center">
            <p className={cn("text-sm font-medium transition-colors", STATE_COLORS[voiceState])}>
              {STATE_LABELS[voiceState]}
            </p>
            {transcript && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-cyan-400/50 mt-2 italic max-w-xs"
              >
                "{transcript}"
              </motion.p>
            )}
          </div>

          {/* Main activation button */}
          <button
            onClick={toggleListening}
            disabled={voiceState === "processing" || voiceState === "speaking"}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all border",
              voiceState === "listening"
                ? "bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                : "bg-cyan-500/15 border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25 hover:shadow-neon-blue",
              (voiceState === "processing" || voiceState === "speaking") &&
                "opacity-40 cursor-not-allowed"
            )}
          >
            {voiceState === "listening" ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Activate Voice
              </>
            )}
          </button>

          {/* ── Clap Detection Panel ── */}
          <div className="w-full space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hand className="w-4 h-4 text-cyan-400/60" />
                <span className="text-xs font-medium text-cyan-300">Clap Detection</span>
                {contextSuspended && (
                  <span className="text-[10px] text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">
                    SUSPENDED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClapDebug(!showClapDebug)}
                  className={cn(
                    "p-1 rounded transition-all",
                    showClapDebug ? "text-cyan-300" : "text-cyan-400/30 hover:text-cyan-400"
                  )}
                  title="Toggle debug monitor"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={toggleClapDetection}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                    clapEnabled
                      ? "bg-green-500/15 border-green-500/20 text-green-300"
                      : "bg-cyan-500/10 border-cyan-500/15 text-cyan-400/60 hover:text-cyan-300"
                  )}
                >
                  {clapEnabled ? "Active" : "Enable"}
                </button>
              </div>
            </div>

            {/* Waveform + mic level bar — only when active */}
            {clapEnabled && (
              <div className="space-y-2">
                {/* Live waveform */}
                <div className="flex items-end justify-center gap-0.5 h-10 bg-cyan-500/5 rounded-lg px-3 py-2 border border-cyan-500/10">
                  {waveformBars.map((val, i) => {
                    const h = Math.max(2, Math.round((val / 128) * 28));
                    const isHot = micLevel > noiseFloor + sensitivityRef.current;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-1 rounded-full transition-all",
                          isHot ? "bg-green-400" : "bg-cyan-500/60"
                        )}
                        style={{ height: `${h}px` }}
                      />
                    );
                  })}
                </div>

                {/* Amplitude meter */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-cyan-400/40 uppercase tracking-wider">Mic Level</span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      {micLevel} / {Math.round(noiseFloor + sensitivityRef.current)} threshold
                    </span>
                  </div>
                  <div className="h-2 bg-cyan-500/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-75",
                        micLevel > noiseFloor + sensitivityRef.current
                          ? "bg-green-400"
                          : micLevel > (noiseFloor + sensitivityRef.current) * 0.7
                          ? "bg-yellow-400"
                          : "bg-cyan-500/60"
                      )}
                      style={{ width: `${Math.min((micLevel / 255) * 100, 100)}%` }}
                    />
                  </div>
                  {/* Threshold marker */}
                  <div className="relative h-1">
                    <div
                      className="absolute top-0 w-0.5 h-2 bg-red-400/70 rounded"
                      style={{
                        left: `${Math.min(((noiseFloor + sensitivityRef.current) / 255) * 100, 99)}%`,
                      }}
                      title="Threshold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sensitivity slider + calibration */}
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/8 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-cyan-400/50 uppercase tracking-wider flex items-center gap-1">
                    <Settings2 className="w-3 h-3" /> Sensitivity
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300">
                    +{clapSensitivity} above noise ({noiseFloor})
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={150}
                  value={clapSensitivity}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setClapSensitivity(v);
                    sensitivityRef.current = v;
                  }}
                  className="w-full h-1.5 bg-cyan-500/20 rounded-full appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-cyan-400/25">
                  <span>Very sensitive</span>
                  <span>Less sensitive</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={runCalibration}
                  disabled={!clapEnabled || calibrating}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
                    calibrating
                      ? "bg-yellow-500/15 border-yellow-500/20 text-yellow-300 animate-pulse"
                      : clapEnabled
                      ? "bg-cyan-500/10 border-cyan-500/15 text-cyan-300 hover:bg-cyan-500/20"
                      : "border-cyan-500/5 text-cyan-400/20 cursor-not-allowed"
                  )}
                >
                  {calibrating ? "Calibrating (3s)..." : "Auto-Calibrate Noise"}
                </button>
              </div>
              <p className="text-[10px] text-cyan-400/25 leading-relaxed">
                Double-clap twice within 900ms to trigger. Enable detection first,
                then calibrate in a quiet environment for accurate noise floor measurement.
              </p>
            </div>

            {/* Context suspended warning */}
            {contextSuspended && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/8 border border-yellow-500/15">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-medium text-yellow-300">AudioContext suspended</p>
                  <p className="text-[10px] text-yellow-400/50 mt-0.5">
                    Browser paused audio processing when tab was hidden. Click anywhere in the tab to resume.
                  </p>
                </div>
              </div>
            )}

            {/* Debug log */}
            {showClapDebug && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-[#010a14] border border-cyan-500/10 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/8">
                  <span className="text-[10px] text-cyan-400/50 uppercase tracking-wider font-mono">
                    Clap Debug Log
                  </span>
                  <button
                    onClick={() => setClapDebugLog([])}
                    className="text-[9px] text-cyan-400/30 hover:text-cyan-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="p-3 space-y-1 max-h-40 overflow-y-auto font-mono">
                  {clapDebugLog.length === 0 ? (
                    <p className="text-[10px] text-cyan-400/20">Waiting for clap events...</p>
                  ) : (
                    clapDebugLog.map((line, i) => (
                      <p
                        key={i}
                        className={cn(
                          "text-[10px]",
                          line.includes("✓") ? "text-green-400" : "text-cyan-400/50"
                        )}
                      >
                        {line}
                      </p>
                    ))
                  )}
                </div>
                <div className="px-3 pb-2 space-y-0.5">
                  <div className="text-[9px] text-cyan-400/25 font-mono">
                    Floor: {noiseFloor} | Threshold: {Math.round(noiseFloor + sensitivityRef.current)} | Raw peak: {micLevel} | Context: {audioCtxRef.current?.state ?? "off"}
                  </div>
                  <div className="text-[9px] text-cyan-400/20 font-mono">
                    Req. rise ≥30 | Req. silence ≥80ms | Cooldown: {activationCooldownRef.current > 0 ? `${Math.max(0, Math.round((3000 - (Date.now() - activationCooldownRef.current)) / 1000))}s left` : "ready"} | Speaking lock: {isSpeakingRef.current ? "LOCKED" : "open"}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Conversation history */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="glass panel-glow rounded-2xl p-5 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              Voice Log
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 max-h-80">
            {history.length === 0 ? (
              <p className="text-xs text-cyan-400/30 text-center py-8">
                Voice interaction history will appear here
              </p>
            ) : (
              history.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: item.type === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-3 rounded-lg text-xs",
                    item.type === "user"
                      ? "bg-cyan-500/10 border border-cyan-500/15 text-cyan-200 ml-8"
                      : "bg-purple-500/10 border border-purple-500/15 text-purple-200 mr-8"
                  )}
                >
                  <span className={cn("font-bold text-[10px] uppercase tracking-wider block mb-1",
                    item.type === "user" ? "text-cyan-400/60" : "text-purple-400/60"
                  )}>
                    {item.type === "user" ? "You" : "JARVIS"}
                  </span>
                  {item.text}
                </motion.div>
              ))
            )}
            <div ref={historyEndRef} />
          </div>
        </motion.div>
      </div>

      {/* Voice commands reference */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass panel-glow rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
            Available Commands
          </h3>
          <span className="ml-auto text-[10px] text-cyan-400/30 font-mono">Say any phrase below</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            { cmd: '"Open dashboard"', desc: "Command Center" },
            { cmd: '"Open chat"', desc: "AI Chat panel" },
            { cmd: '"Show tasks"', desc: "Operations" },
            { cmd: '"Daily briefing"', desc: "AI summary" },
            { cmd: '"What time is it"', desc: "Current time" },
            { cmd: '"Open notes"', desc: "Intelligence notes" },
            { cmd: '"Open settings"', desc: "System config" },
            { cmd: '"Open memory"', desc: "AI memory" },
          ].map((item) => (
            <div
              key={item.cmd}
              className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/8 space-y-1"
            >
              <p className="text-[11px] font-mono text-cyan-300">{item.cmd}</p>
              <p className="text-[10px] text-cyan-400/40">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

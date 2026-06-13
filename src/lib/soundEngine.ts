"use client";

// Procedural sound effects + background wind ambience using the Web Audio API.
// No external audio assets.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isMuted = false;
let currentVolume = 0.6;
let hasResumed = false;
let bootFadedIn = false;

const VOLUME = 0.12;
const WIND_VOLUME = 0.04;
const BOOT_FADE_SECONDS = 2.2;

let windNode: AudioBufferSourceNode | null = null;
let windGain: GainNode | null = null;
let windBuffer: AudioBuffer | null = null;
let lastWhoosh = 0;
let lastVelocity = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

async function resumeIfNeeded(): Promise<boolean> {
  const ctx = getCtx();
  if (!ctx) return false;
  if (ctx.state === "running") return true;
  if (hasResumed && ctx.state !== "suspended") return true;
  try {
    await ctx.resume();
    hasResumed = (ctx.state as string) === "running";
    return hasResumed;
  } catch {
    return false;
  }
}

function now(): number {
  const ctx = getCtx();
  return ctx ? ctx.currentTime : 0;
}

function createWindBuffer(): AudioBuffer | null {
  const ctx = getCtx();
  if (!ctx) return null;
  const duration = 4;
  const samples = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(2, samples, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < samples; i++) {
      const t = i / ctx.sampleRate;
      const n = Math.random() * 2 - 1;
      const slow = Math.sin(t * 0.4 + ch) * 0.5 + 0.5;
      const gust = Math.sin(t * 1.2 + ch * 2) * 0.5 + 0.5;
      data[i] = n * (0.05 + slow * 0.08 + gust * 0.04);
    }
  }
  return buffer;
}

function startWindLoop() {
  const ctx = getCtx();
  if (!ctx || !masterGain || windNode) return;
  if (!windBuffer) windBuffer = createWindBuffer();
  if (!windBuffer) return;

  const src = ctx.createBufferSource();
  src.buffer = windBuffer;
  src.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = isMuted || !bootFadedIn ? 0 : WIND_VOLUME * currentVolume;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start();

  windNode = src;
  windGain = gain;
}

function stopWindLoop() {
  if (windNode) {
    try {
      windNode.stop();
    } catch {
      // already stopped
    }
    windNode.disconnect();
    windNode = null;
  }
  windGain = null;
}

let unlockListenerAdded = false;

function addUnlockListener() {
  if (unlockListenerAdded || typeof document === "undefined") return;
  unlockListenerAdded = true;
  const tryUnlock = () => {
    if (!isMuted) {
      fadeIn();
    }
  };
  document.addEventListener("click", tryUnlock, { once: true });
  document.addEventListener("keydown", tryUnlock, { once: true });
}

function applyVolume() {
  if (masterGain && audioCtx) {
    const t = audioCtx.currentTime;
    const target = isMuted || !bootFadedIn ? 0 : VOLUME * currentVolume;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setTargetAtTime(target, t, 0.02);
  }
  if (windGain && audioCtx) {
    const target = isMuted || !bootFadedIn ? 0 : WIND_VOLUME * currentVolume;
    windGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.02);
  }
}

const setVolume = (volume: number) => {
  currentVolume = Math.max(0, Math.min(1, volume));
  applyVolume();
};

function setMuted(muted: boolean, volume?: number) {
  if (typeof volume === "number") currentVolume = Math.max(0, Math.min(1, volume));
  isMuted = muted;
  applyVolume();
  if (muted) {
    stopWindLoop();
  } else {
    startWindLoop();
  }
}

async function fadeIn(volume?: number) {
  if (isMuted) return;
  if (typeof volume === "number") currentVolume = Math.max(0, Math.min(1, volume));

  const resumed = await resumeIfNeeded();
  startWindLoop();

  if (!resumed) {
    // Browser autoplay policy is still blocking us — fade in on the first user gesture.
    addUnlockListener();
    return;
  }

  if (bootFadedIn) return;
  bootFadedIn = true;

  const ctx = getCtx();
  if (!ctx || !masterGain) return;

  const t = ctx.currentTime;
  const masterTarget = VOLUME * currentVolume;
  const windTarget = WIND_VOLUME * currentVolume;

  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setValueAtTime(0, t);
  masterGain.gain.linearRampToValueAtTime(masterTarget, t + BOOT_FADE_SECONDS);

  if (windGain) {
    windGain.gain.cancelScheduledValues(t);
    windGain.gain.setValueAtTime(0, t);
    windGain.gain.linearRampToValueAtTime(windTarget, t + BOOT_FADE_SECONDS);
  }
}

// ─── Helpers ────────────────────────────────────────────

function createOsc(
  type: OscillatorType,
  freq: number,
  start: number,
  duration: number,
  gainValue: number,
  fade = 0.01
) {
  const ctx = getCtx();
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainValue, start + fade);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function noiseBuffer(duration = 0.05): AudioBuffer | null {
  const ctx = getCtx();
  if (!ctx) return null;
  const size = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (size * 0.25));
  }
  return buffer;
}

function playNoise(duration = 0.05, gainValue = 0.3) {
  const ctx = getCtx();
  if (!ctx || !masterGain) return;
  const buffer = noiseBuffer(duration);
  if (!buffer) return;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  gain.gain.setValueAtTime(gainValue, now());
  gain.gain.exponentialRampToValueAtTime(0.0001, now() + duration);
  src.connect(gain);
  gain.connect(masterGain);
  src.start(now());
}

// ─── Sound presets ────────────────────────────────────────

export const soundEngine = {
  setMuted,
  setVolume,

  init() {
    getCtx();
    if (!isMuted) startWindLoop();
  },

  fadeIn,

  setScrollVelocity(velocity: number) {
    if (!windGain || !audioCtx) return;
    const boost = Math.min(1, Math.max(0, (velocity - 50) / 1200));
    const target = (WIND_VOLUME + boost * 0.06) * currentVolume;
    windGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.15);

    const nowMs = Date.now();
    if (velocity > 1200 && velocity > lastVelocity * 1.6 && nowMs - lastWhoosh > 800) {
      lastWhoosh = nowMs;
      soundEngine.whoosh();
    }
    lastVelocity = velocity;
  },

  async click() {
    await resumeIfNeeded();
    createOsc("sine", 1200, now(), 0.04, 0.4);
  },

  async hover() {
    await resumeIfNeeded();
    createOsc("sine", 900, now(), 0.03, 0.15);
  },

  async key() {
    await resumeIfNeeded();
    createOsc("triangle", 600 + Math.random() * 80, now(), 0.02, 0.08);
  },

  async enter() {
    await resumeIfNeeded();
    createOsc("sine", 880, now(), 0.05, 0.25);
    createOsc("sine", 1320, now() + 0.02, 0.05, 0.15);
  },

  async open() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 440, t, 0.08, 0.25);
    createOsc("sine", 660, t + 0.04, 0.1, 0.2);
    createOsc("sine", 990, t + 0.08, 0.12, 0.15);
  },

  async close() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 990, t, 0.06, 0.15);
    createOsc("sine", 660, t + 0.04, 0.06, 0.1);
    createOsc("sine", 440, t + 0.08, 0.08, 0.08);
  },

  async success() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 523, t, 0.08, 0.25);
    createOsc("sine", 784, t + 0.04, 0.08, 0.2);
  },

  async error() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sawtooth", 150, t, 0.12, 0.15);
    createOsc("sawtooth", 140, t + 0.06, 0.12, 0.1);
  },

  async checkpoint() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 880, t, 0.1, 0.25);
    createOsc("sine", 1109, t + 0.08, 0.12, 0.2);
    createOsc("sine", 1319, t + 0.16, 0.18, 0.15);
  },

  async summit() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 523, t, 0.12, 0.25);
    createOsc("sine", 659, t + 0.1, 0.12, 0.25);
    createOsc("sine", 784, t + 0.2, 0.12, 0.25);
    createOsc("sine", 1047, t + 0.3, 0.4, 0.25);
  },

  async golden() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 987, t, 0.06, 0.2);
    createOsc("sine", 1319, t + 0.04, 0.06, 0.2);
    createOsc("sine", 1976, t + 0.08, 0.5, 0.15);
  },

  async wind() {
    await resumeIfNeeded();
    playNoise(0.2, 0.08);
  },

  async nav() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 660, t, 0.06, 0.2);
    createOsc("sine", 990, t + 0.03, 0.08, 0.15);
  },

  async whoosh() {
    await resumeIfNeeded();
    playNoise(0.35, 0.06);
  },

  // Opera GX-style crystalline card hover blip
  async cardHover() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 1800, t, 0.03, 0.06);
    createOsc("sine", 2400, t + 0.01, 0.02, 0.04);
  },

  async cardClick() {
    await resumeIfNeeded();
    const t = now();
    createOsc("sine", 1400, t, 0.04, 0.12);
    createOsc("sine", 2100, t + 0.015, 0.03, 0.06);
  },
};

export default soundEngine;

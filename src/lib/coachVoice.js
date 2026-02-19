// src/lib/coachVoice.js
// Coach voice: prefers OpenAI TTS (real voice) via /api/tts/stream when available;
// falls back to Web Speech API (synthesized). Countdown beep uses Web Audio API.

let audioCtx = null;
let audioUnlocked = false;

// When TTS server is running (Vite proxies /api to it), we use real OpenAI voice.
const TTS_API_BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TTS_API_URL != null
  ? import.meta.env.VITE_TTS_API_URL
  : '';

let currentTTSAbort = null;
let currentTTSAudio = null;

// ─── Audio Context ─────────────────────────────────────────────
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// ─── Unlock Audio (MUST be called from a user gesture) ─────────
// iOS/Safari blocks audio until a user interaction triggers playback.
// Call this from the FIRST tap/click inside the Session component.
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const ctx = getAudioContext();
    // Resume suspended context (Safari requirement)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    // Play a silent buffer to fully unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    audioUnlocked = true;
    console.log('[CoachVoice] Audio unlocked');
  } catch (e) {
    console.warn('[CoachVoice] Audio unlock failed:', e);
  }
}

// ─── Beep (Web Audio API) ──────────────────────────────────────
// Plays a short sine-wave beep. Used for countdown in last 10s.
// Resumes context if suspended (e.g. Safari) so beeps play after user gesture.
export function playCountdownBeep(frequency = 880, durationMs = 120) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    // Quick fade-out to avoid click
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.warn('[CoachVoice] Beep failed:', e);
  }
}

// ─── Stop any current TTS playback ─────────────────────────────
function stopTTS() {
  if (currentTTSAbort) {
    currentTTSAbort.abort();
    currentTTSAbort = null;
  }
  if (currentTTSAudio) {
    try {
      currentTTSAudio.pause();
      currentTTSAudio.src = '';
    } catch (_) {}
    currentTTSAudio = null;
  }
}

// ─── Real voice via TTS server (OpenAI) ─────────────────────────
// Returns a Promise that resolves when playback ends, or rejects on error.
function playViaTTS(text, voicePreference = 'female') {
  const url = `${TTS_API_BASE}/api/tts/stream`.replace(/\/+/g, '/');
  const body = JSON.stringify({ text, voice: voicePreference });

  stopTTS();
  window.speechSynthesis?.cancel();

  const abort = new AbortController();
  currentTTSAbort = abort;

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: abort.signal,
  })
    .then((res) => {
      currentTTSAbort = null;
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const audio = new Audio(objectUrl);
        currentTTSAudio = audio;
        audio.onended = () => {
          URL.revokeObjectURL(objectUrl);
          currentTTSAudio = null;
          resolve();
        };
        audio.onerror = (e) => {
          URL.revokeObjectURL(objectUrl);
          currentTTSAudio = null;
          reject(e);
        };
        audio.play().catch(reject);
      });
    })
    .catch((err) => {
      currentTTSAbort = null;
      if (err?.name === 'AbortError') return Promise.reject(err);
      throw err;
    });
}

// ─── Speech: real voice only via TTS server (no browser synthesis) ─
// Returns a Promise that resolves when playback ends. On TTS failure, resolves without speaking.
function speakText(text, voicePreference = 'female') {
  return playViaTTS(text, voicePreference).catch(() => {
    // TTS unavailable or failed: stay silent (no synthesized fallback)
  });
}

// ─── Public: speak wrapper ─────────────────────────────────────
export function speak(text, voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  return speakText(text, voicePreference);
}

// ─── Public: get ready (pre-session countdown page) ─────────────
export function speakGetReady(voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  return speakText("Get ready. You've got this!", voicePreference);
}

// ─── Public: start (at beginning of each exercise work phase) ───
export function speakStart(voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  return speakText("Go! Give it everything you've got!", voicePreference);
}

// ─── Public: countdown number (last 10 seconds of work); encouraging on 3, 2, 1
export function speakCountdownNumber(n, voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  if (n < 1 || n > 10) return Promise.resolve();
  const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const base = words[n].charAt(0).toUpperCase() + words[n].slice(1);
  const text = n === 3 ? 'Three! Keep it up!' : n === 2 ? 'Two! Almost there!' : n === 1 ? 'One! Last second!' : base;
  return speakText(text, voicePreference);
}

// ─── Public: next exercise is (at end of exercise, before "Next in" countdown)
export function speakNextExerciseIs(exerciseName, voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  const text = `Nice work! Next up, ${exerciseName}. You're doing great.`;
  return speakText(text, voicePreference);
}

// ─── Public: announce next exercise (legacy / alternate) ─────────
export function speakNextExercise(exerciseName, voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  const text = `Next up: ${exerciseName}. Get ready. You've got this.`;
  return speakText(text, voicePreference);
}

// ─── Public: announce session start ────────────────────────────
export function speakSessionStart(exerciseName, voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  const text = `Let's go! You're going to crush this. Starting with ${exerciseName}.`;
  return speakText(text, voicePreference);
}

// ─── Public: announce session complete ─────────────────────────
export function speakSessionComplete(voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  return speakText("Amazing work! Session complete. You crushed it today!", voicePreference);
}

// ─── Preload voices ────────────────────────────────────────────
// Some browsers load voices asynchronously. Call early.
export function preloadVoices() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    // Chrome fires voiceschanged when voices are ready
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

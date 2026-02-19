// src/lib/coachVoice.js
// Coach voice: prefers OpenAI TTS (real voice) via /api/tts/stream when available;
// falls back to Web Speech API (synthesized). Countdown beep uses Web Audio API.
// iOS: use a single persistent <audio> element + unlock with silent play (see fix-iphone-audio.md).

let audioCtx = null;
let audioUnlocked = false;

// TTS server URL. In dev, Vite proxies /api to localhost:3000. In production, set
// VITE_TTS_API_URL to your deployed TTS server (e.g. Railway/Render) or leave unset
// so we don't call /api at all (avoids 404 on static hosts like Netlify).
const TTS_API_BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TTS_API_URL != null
  ? import.meta.env.VITE_TTS_API_URL
  : '';

// In production without VITE_TTS_API_URL, there is no TTS server (e.g. Netlify is static-only).
// Skip the request so we don't GET/POST /api/tts/stream and get 404.
const TTS_AVAILABLE = typeof import.meta !== 'undefined'
  ? (import.meta.env.DEV || (import.meta.env.VITE_TTS_API_URL != null && import.meta.env.VITE_TTS_API_URL !== ''))
  : false;

let currentTTSAbort = null;

// Silent MP3 data URL for iOS: unlock the persistent audio element on first user gesture.
const SILENT_MP3 =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRBqpAAAAAAD/+1DEAAAHAAGf9AAAIgAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';

let ttsAudioEl = null;
let ttsAudioUnlocked = false;

/** Single persistent <audio> for TTS (iOS requires reuse, not new Audio() each time). */
function getTTSAudioElement() {
  if (ttsAudioEl) return ttsAudioEl;
  if (typeof document === 'undefined') return null;
  ttsAudioEl = document.createElement('audio');
  ttsAudioEl.setAttribute('playsinline', 'true');
  ttsAudioEl.setAttribute('webkit-playsinline', 'true');
  document.body.appendChild(ttsAudioEl);
  return ttsAudioEl;
}

// ─── Audio Context ─────────────────────────────────────────────
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// ─── Unlock Audio (MUST be called from a user gesture) ─────────
// iOS/Safari: (1) Web Audio context for beeps; (2) persistent <audio> for TTS (silent play).
// Call from the first tap that starts the session (e.g. "Start session" button).
export function unlockAudio() {
  // Web Audio API: for countdown beeps
  if (!audioUnlocked) {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      audioUnlocked = true;
    } catch (e) {
      console.warn('[CoachVoice] Web Audio unlock failed:', e);
    }
  }

  // HTML Audio element for TTS: iOS requires unlock with silent play on same element we reuse
  if (ttsAudioUnlocked) return;
  const el = getTTSAudioElement();
  if (!el) return;
  el.src = SILENT_MP3;
  el.play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
      el.src = '';
      ttsAudioUnlocked = true;
    })
    .catch((e) => console.warn('[CoachVoice] TTS audio unlock failed:', e));
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
  const el = getTTSAudioElement();
  if (el) {
    try {
      el.pause();
      el.src = '';
    } catch (_) {}
  }
}

// ─── Real voice via TTS server (OpenAI) ─────────────────────────
// Returns a Promise that resolves when playback ends, or rejects on error.
function playViaTTS(text, voicePreference = 'female') {
  if (!TTS_AVAILABLE) {
    return Promise.resolve(); // Production without TTS server: no request, no 404
  }

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
      const audio = getTTSAudioElement();
      if (!audio) {
        URL.revokeObjectURL(objectUrl);
        return Promise.reject(new Error('No TTS audio element'));
      }
      return new Promise((resolve, reject) => {
        const onEnd = () => {
          audio.removeEventListener('ended', onEnd);
          audio.removeEventListener('error', onErr);
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        const onErr = (e) => {
          audio.removeEventListener('ended', onEnd);
          audio.removeEventListener('error', onErr);
          URL.revokeObjectURL(objectUrl);
          reject(e);
        };
        audio.addEventListener('ended', onEnd);
        audio.addEventListener('error', onErr);
        audio.src = objectUrl;
        audio.play().catch(reject);
      });
    })
    .catch((err) => {
      currentTTSAbort = null;
      if (err?.name === 'AbortError') return Promise.reject(err);
      throw err;
    });
}

// ─── Browser synthesis (Web Speech API) ─────────────────────────
// Fallback when real TTS is unavailable or fails.
function speakWithSynthesis(text, voicePreference = 'female') {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferFemale = voicePreference === 'female';
      const femaleHints = ['female', 'woman', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'susan'];
      const maleHints = ['male', 'man', 'daniel', 'james', 'alex', 'fred', 'thomas', 'gordon', 'lee'];
      const hints = preferFemale ? femaleHints : maleHints;
      const match = voices.find(v => {
        const name = v.name.toLowerCase();
        return hints.some(h => name.includes(h)) && v.lang.startsWith('en');
      });
      if (match) utterance.voice = match;
      else {
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }
    }

    utterance.onend = resolve;
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') console.warn('[CoachVoice] Speech error:', e.error, e);
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
}

// ─── Speech: real TTS when available, else synthetic ───────────────
function speakText(text, voicePreference = 'female') {
  if (!TTS_AVAILABLE) {
    return speakWithSynthesis(text, voicePreference);
  }
  return playViaTTS(text, voicePreference).catch(() => {
    return speakWithSynthesis(text, voicePreference);
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

# Fix: Audio Not Playing on iPhone (Works on Desktop)

## Why This Happens
iOS Safari has **much stricter audio playback rules** than desktop browsers:
1. `new Audio()` created dynamically often **silently fails** on iOS
2. Audio **must** be triggered by a direct user tap (not async callbacks)
3. The audio element must be "unlocked" on the **first user gesture**
4. Blob URLs with dynamically created Audio objects are unreliable on iOS

---

## The Fix: Use a Persistent Audio Element + Unlock Pattern

### Key Principles
- Create the `<audio>` element **once** (not on every play)
- "Unlock" it on the **first user tap** with a silent play
- Set `.src` to a blob URL **after** fetching
- Use `.setAttribute("playsinline", "true")` for iOS

---

## Fix for Vanilla JS

```js
// Create a SINGLE persistent audio element (do this once, globally)
const audio = document.createElement("audio");
audio.setAttribute("playsinline", "true");
audio.setAttribute("webkit-playsinline", "true");
document.body.appendChild(audio);

let isAudioUnlocked = false;

// Unlock audio on first user tap (iOS requirement)
function unlockAudio() {
  if (isAudioUnlocked) return;

  // Play a tiny silent buffer to "unlock" the audio element
  audio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRBqpAAAAAAD/+1DEAAAHAAGf9AAAIgAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";
  audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
    isAudioUnlocked = true;
    console.log("Audio unlocked for iOS");
  }).catch((e) => {
    console.log("Audio unlock failed:", e);
  });
}

// Call this on ANY user interaction (tap, click)
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("touchstart", unlockAudio, { once: true });

// Play OpenAI TTS audio
async function playTTS(text) {
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "alloy", model: "tts-1" }),
    });

    if (!response.ok) throw new Error("API request failed");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Reuse the same audio element (critical for iOS)
    audio.src = url;
    audio.onended = () => URL.revokeObjectURL(url);

    await audio.play();
  } catch (error) {
    console.error("Playback error:", error);
  }
}

// Wire up to a button
document.getElementById("speak-btn").addEventListener("click", () => {
  playTTS("Hello from your iPhone!");
});
```

---

## Fix for React / Next.js

```jsx
"use client";
import { useRef, useEffect, useState, useCallback } from "react";

export default function SpeechButton({ text }) {
  const audioRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Create persistent audio element once
  useEffect(() => {
    const el = new Audio();
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    audioRef.current = el;

    return () => {
      el.pause();
      el.src = "";
    };
  }, []);

  // Unlock audio on first tap (iOS requirement)
  const unlockAudio = useCallback(async () => {
    if (unlocked || !audioRef.current) return;
    try {
      audioRef.current.src =
        "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRBqpAAAAAAD/+1DEAAAHAAGf9AAAIgAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setUnlocked(true);
    } catch (e) {
      console.log("Unlock failed:", e);
    }
  }, [unlocked]);

  const handlePlay = async () => {
    // Unlock on first interaction if needed
    await unlockAudio();

    setLoading(true);
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "alloy", model: "tts-1" }),
      });

      if (!res.ok) throw new Error("API failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = audioRef.current;

      audio.src = url;
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      console.error("Playback error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePlay} disabled={loading}>
      {loading ? "Loading..." : "🔊 Play"}
    </button>
  );
}
```

---

## API Route (make sure this is correct too)

```js
// app/api/speech/route.js
export const runtime = "edge";

export async function POST(req) {
  const { text, voice, model } = await req.json();

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "tts-1",
      voice: voice || "alloy",
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  });
}
```

---

## What Was Wrong — Summary

| ❌ Breaks on iPhone | ✅ Works on iPhone |
|---|---|
| `new Audio(url)` created dynamically each time | Single persistent `<audio>` element reused |
| No `playsinline` attribute | `playsinline` and `webkit-playsinline` set |
| Audio played without prior user gesture | Audio "unlocked" on first tap with silent buffer |
| Audio triggered in async callback far from tap | Play triggered directly in click handler |

---

## Still Not Working? Debug on iPhone

1. **Connect iPhone to Mac** via USB
2. On iPhone: Settings → Safari → Advanced → **Web Inspector ON**
3. On Mac: Open Safari → Develop menu → select your iPhone
4. Check the **Console** for errors when you tap play

Common iOS errors:
- `NotAllowedError: The request is not allowed` → Audio not unlocked on user gesture
- `AbortError: The operation was aborted` → Audio src changed before play finished
- No error but no sound → Check iPhone is not on **Silent Mode** (flip the physical switch on the side of the phone)

> ⚠️ **Don't forget:** The physical **mute switch** on the left side of the iPhone will silence your app's audio even if volume is up!

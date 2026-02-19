# Fix OpenAI Audio Not Playing on Vercel

## Problem
OpenAI TTS (text-to-speech) audio is not playing when deployed to Vercel.

---

## Step 1: Set Your Environment Variable

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and make sure you have:

```
OPENAI_API_KEY=sk-your-key-here
```

> ⚠️ Your local `.env` file does NOT carry over to Vercel. You must add it in the dashboard. After adding it, **redeploy** your project.

---

## Step 2: Create the API Route (Edge Runtime)

Create or replace the file `app/api/speech/route.js` (or `.ts`):

```js
export const runtime = "edge";

export async function POST(req) {
  try {
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
        input: text || "Hello, this is a test.",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return new Response(JSON.stringify({ error: errorText }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stream the audio back to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Speech API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### Why Edge Runtime?
- Vercel serverless functions have a **4.5MB body limit** and **10s timeout** — audio can exceed both.
- Edge functions have **no body size limit** and **longer timeouts**.
- Adding `export const runtime = "edge";` at the top switches to edge.

---

## Step 3: Frontend — Play the Audio

Make sure your frontend handles the audio blob correctly. The key points:
1. Fetch the audio as a **blob**
2. Create an **object URL** from the blob
3. Play it — **must be triggered by a user click** (browser autoplay policy)

```js
async function playAudio(text) {
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        voice: "alloy",    // Options: alloy, echo, fable, onyx, nova, shimmer
        model: "tts-1",    // Options: tts-1, tts-1-hd
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("API error:", err);
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    await audio.play();

    // Clean up the blob URL after playback
    audio.onended = () => URL.revokeObjectURL(audioUrl);
  } catch (error) {
    console.error("Audio playback error:", error);
  }
}

// ✅ CORRECT — triggered by user click
document.getElementById("play-btn").addEventListener("click", () => {
  playAudio("Hello, this is working!");
});

// ❌ WRONG — browser will block this
// playAudio("This will be blocked by autoplay policy");
```

### React Example

```jsx
function SpeechButton({ text }) {
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "alloy", model: "tts-1" }),
      });

      if (!res.ok) throw new Error("API request failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePlay} disabled={loading}>
      {loading ? "Loading..." : "Play Audio"}
    </button>
  );
}
```

---

## Step 4: Redeploy

After making changes:

```bash
git add .
git commit -m "fix: OpenAI audio streaming via edge runtime"
git push
```

Vercel will auto-deploy. Check the **Vercel Logs** (Dashboard → Logs) if it still doesn't work.

---

## Common Issues Checklist

| Issue | Fix |
|-------|-----|
| No audio, no errors | Check that `OPENAI_API_KEY` is set in Vercel env vars and redeploy |
| `500` error from API route | Check Vercel Logs — likely missing or invalid API key |
| `NotAllowedError` in console | Audio must be triggered by a user click/tap, not on page load |
| Audio cuts off or is empty | Switch to `export const runtime = "edge"` to avoid size/timeout limits |
| `CORS` error | Make sure you're calling `/api/speech` (same origin), not the OpenAI URL directly from the browser |
| `Failed to fetch` | Check that the route path matches (`/api/speech` → `app/api/speech/route.js`) |
| Works locally, not on Vercel | Env var is missing on Vercel — add it in dashboard and redeploy |

---

## Debugging Tips

Add this temporary test route to confirm your API key works:

```js
// app/api/test-key/route.js
export const runtime = "edge";

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const keyPrefix = process.env.OPENAI_API_KEY?.slice(0, 7) || "NOT SET";
  return new Response(
    JSON.stringify({ hasKey, keyPrefix }),
    { headers: { "Content-Type": "application/json" } }
  );
}
```

Visit `/api/test-key` on your deployed site. You should see:
```json
{ "hasKey": true, "keyPrefix": "sk-proj" }
```

> ⚠️ Delete this test route before going to production.

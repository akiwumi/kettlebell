# OpenAI TTS Integration

## Overview

Add human-sounding text-to-speech to this web app using the OpenAI TTS API. Support both real-time streaming playback and pre-generated audio file storage.

---

## Tech Stack

- **Runtime:** Node.js with Express (TypeScript)
- **TTS Provider:** OpenAI (`openai` npm package)
- **Audio Format:** MP3 (most compatible) or Opus (lowest latency for streaming)
- **Frontend:** Vanilla JS/TS (framework-agnostic)

---

## Environment

```env
OPENAI_API_KEY=sk-...
```

Store in `.env` at project root. Never expose this key to the client.

---

## Dependencies

```bash
npm install openai express dotenv
npm install -D @types/express typescript
```

---

## Project Structure

```
src/
├── server.ts                  # Express server entry point
├── routes/
│   └── tts.ts                 # TTS route handlers
├── services/
│   └── tts.service.ts         # OpenAI TTS logic (streaming + file generation)
├── utils/
│   └── chunker.ts             # Text splitting utility (max 4096 chars per request)
public/
├── audio/                     # Directory for pre-generated audio files
├── index.html                 # Demo page with playback controls
└── js/
    └── tts-client.ts          # Frontend TTS playback helpers
```

---

## Backend Implementation

### 1. TTS Service (`src/services/tts.service.ts`)

Create a service class with two methods:

#### `stream(text: string, voice: string): Promise<ReadableStream>`
- Use `openai.audio.speech.create()` with model `tts-1` (optimized for speed)
- Return the response body as a readable stream
- Default voice: `"nova"`
- Default response format: `"mp3"`

#### `generate(text: string, voice: string, filename: string): Promise<string>`
- Use `openai.audio.speech.create()` with model `tts-1-hd` (optimized for quality)
- Convert response to buffer via `response.arrayBuffer()`
- Write buffer to `public/audio/{filename}`
- Return the public URL path `/audio/{filename}`

#### Configuration
- Available models: `tts-1` (fast, lower quality), `tts-1-hd` (slower, higher quality)
- Available voices: `alloy`, `ash`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`
- Available formats: `mp3`, `opus`, `aac`, `flac`, `wav`, `pcm`
- Max input length: **4096 characters** per request

### 2. Text Chunker (`src/utils/chunker.ts`)

Create a utility function:

#### `splitText(text: string, maxLength: number = 4096): string[]`
- Split text into chunks of max 4096 characters
- Split on sentence boundaries (`. `, `! `, `? `) to preserve natural speech flow
- Never split in the middle of a word

### 3. API Routes (`src/routes/tts.ts`)

#### `POST /api/tts/stream`
- **Request body:** `{ text: string, voice?: string, format?: string }`
- **Response:** Streamed audio with `Content-Type: audio/mpeg` and `Transfer-Encoding: chunked`
- If text exceeds 4096 chars, use chunker and stream chunks sequentially
- Set appropriate CORS headers

#### `POST /api/tts/generate`
- **Request body:** `{ text: string, voice?: string, filename?: string }`
- **Response:** `{ url: string, filename: string }`
- Auto-generate filename if not provided (e.g., `tts_{timestamp}.mp3`)
- If text exceeds 4096 chars, generate chunks and concatenate into a single file

#### `GET /api/tts/voices`
- **Response:** Array of available voice objects with `id` and `description`
- Hardcoded list:
  - `alloy` — Neutral, balanced
  - `ash` — Warm, conversational
  - `coral` — Clear, friendly
  - `echo` — Smooth, measured
  - `fable` — Expressive, British accent
  - `nova` — Warm, natural (recommended default)
  - `onyx` — Deep, authoritative
  - `sage` — Calm, wise
  - `shimmer` — Bright, upbeat

### 4. Server Setup (`src/server.ts`)

- Load env vars with dotenv
- Configure Express with JSON body parser
- Serve `public/` as static files
- Mount TTS routes at `/api/tts`
- Ensure `public/audio/` directory exists on startup
- Start on port `3000` (or `PORT` env var)

---

## Frontend Implementation

### 5. TTS Client (`public/js/tts-client.ts`)

Create a client module with these functions:

#### `playStream(text: string, voice?: string): Promise<void>`
- Fetch from `/api/tts/stream` as a POST request
- Convert response to blob, create object URL
- Create `Audio` element and play
- Revoke object URL on `ended` event to prevent memory leaks

#### `playStreamRealtime(text: string, voice?: string): Promise<void>`
- Fetch from `/api/tts/stream` as a POST request
- Use `MediaSource` API for true streaming playback (audio starts before full download)
- Create `MediaSource`, attach to `Audio` element
- On `sourceopen`, create `SourceBuffer` with `audio/mpeg` MIME type
- Read response body as stream, append chunks to `SourceBuffer`
- Call `mediaSource.endOfStream()` when reader is done
- Include error handling for `QuotaExceededError` on the source buffer

#### `generateAndPlay(text: string, voice?: string): Promise<string>`
- POST to `/api/tts/generate`
- Parse JSON response for `url`
- Create `Audio` element with returned URL and play
- Return the URL for reuse

#### `stopPlayback(): void`
- Stop any currently playing audio
- Clean up resources

### 6. Demo Page (`public/index.html`)

Build a simple UI with:
- A `<textarea>` for text input
- A `<select>` dropdown for voice selection (populated from `/api/tts/voices`)
- Three buttons: "Stream", "Stream (Realtime)", "Generate & Save"
- An audio player element showing current playback
- A status indicator (idle / loading / playing)

---

## Error Handling

- Wrap all OpenAI API calls in try/catch
- Return appropriate HTTP status codes:
  - `400` — Missing or empty text
  - `413` — Text too long (after chunking fails)
  - `429` — OpenAI rate limit hit (forward retry-after header)
  - `500` — OpenAI API error or server error
- Log errors server-side, return generic messages to client
- Handle network failures gracefully on the frontend with user-friendly messages

---

## Key Implementation Notes

1. **Never expose the API key client-side.** All OpenAI calls go through the Express backend.
2. **Use `tts-1` for streaming** (lower latency) and **`tts-1-hd` for pre-generation** (higher quality).
3. **Always split text at sentence boundaries** when it exceeds 4096 characters.
4. **Clean up blob URLs** after playback to prevent memory leaks.
5. **Add CORS headers** if the frontend is served from a different origin.
6. **Create the `public/audio/` directory** on server startup if it doesn't exist.
7. **Consider adding a cache layer** — if the same text + voice combo is requested again, serve the cached file instead of calling the API.

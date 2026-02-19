/**
 * POST /api/tts/stream — body: { text: string, voice?: 'female' | 'male' }
 * Returns audio/mpeg buffer.
 */
import { Router } from "express";
import { streamToBuffer } from "../services/tts.service.js";

export const ttsRouter = Router();

ttsRouter.post("/stream", async (req, res) => {
  try {
    const text = req.body?.text;
    const voice = req.body?.voice ?? "female";

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing or invalid text" });
      return;
    }

    const buffer = await streamToBuffer(text, voice);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "TTS failed";
    console.error("[TTS]", err);
    if (String(message).toLowerCase().includes("api key")) {
      res.status(401).json({ error: "TTS not configured" });
      return;
    }
    res.status(500).json({ error: message });
  }
});

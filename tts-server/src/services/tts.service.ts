/**
 * OpenAI TTS: stream audio for given text.
 * Uses tts-1 for low latency. Maps app voice preference to OpenAI voice.
 */
import OpenAI from "openai";
import { splitText } from "../utils/chunker.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICE_MAP: Record<string, string> = {
  female: "nova",
  male: "onyx",
};

export function getOpenAIVoice(preference: string): string {
  return VOICE_MAP[preference] ?? "nova";
}

/**
 * Generate TTS and return the full audio buffer (for short coach phrases).
 * Chunks if text exceeds 4096 chars.
 */
export async function streamToBuffer(text: string, voicePreference: string): Promise<Buffer> {
  const voice = getOpenAIVoice(voicePreference);
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Missing or empty text");

  const chunks = splitText(trimmed, 4096);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as "alloy" | "ash" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer",
      input: chunk,
      response_format: "mp3",
      speed: 1.0,
    });
    const buf = Buffer.from(await response.arrayBuffer());
    buffers.push(buf);
  }

  return Buffer.concat(buffers);
}

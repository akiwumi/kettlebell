/**
 * Example: generate TTS and save to file.
 * Run: node example-generate.mjs
 * Requires: .env with OPENAI_API_KEY=sk-...
 */
import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

const response = await openai.audio.speech.create({
  model: "tts-1",
  voice: "nova",
  input: "Hello, welcome to my app!",
  response_format: "mp3",
  speed: 1.0,
});

const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync("output.mp3", buffer);
console.log("Saved output.mp3");

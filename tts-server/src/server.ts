import "dotenv/config";
import express from "express";
import { ttsRouter } from "./routes/tts.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "1mb" }));

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use("/api/tts", ttsRouter);

app.listen(PORT, () => {
  console.log(`TTS server http://localhost:${PORT}`);
});

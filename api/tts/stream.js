/**
 * Vercel Edge: POST /api/tts/stream — OpenAI TTS for coach voice.
 * Set OPENAI_API_KEY in Vercel project Environment Variables and redeploy.
 * See fix-vercel-audio.md
 */
export const config = { runtime: 'edge' };

const VOICE_MAP = { female: 'nova', male: 'onyx' };

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const text = body?.text;
    const voicePreference = body?.voice ?? 'female';
    const voice = VOICE_MAP[voicePreference] ?? 'nova';

    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Missing or invalid text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'TTS not configured' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: text.trim().slice(0, 4096),
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI TTS error:', response.status, errText);
      return new Response(JSON.stringify({ error: errText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS stream error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

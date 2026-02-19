/**
 * Split text into chunks of max length, on sentence boundaries.
 * Never splits in the middle of a word.
 */
const SENTENCE_BREAKS = /(?<=[.!?])\s+/g;

export function splitText(text: string, maxLength: number = 4096): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];
  if (trimmed.length <= maxLength) return [trimmed];

  const chunks: string[] = [];
  const sentences = trimmed.split(SENTENCE_BREAKS).filter(Boolean);

  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? current + " " + sentence : sentence;
    if (candidate.length <= maxLength) {
      current = candidate;
    } else {
      if (current) {
        chunks.push(current);
        current = "";
      }
      if (sentence.length > maxLength) {
        for (const wordChunk of splitByWords(sentence, maxLength)) {
          chunks.push(wordChunk);
        }
      } else {
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitByWords(str: string, maxLength: number): string[] {
  const result: string[] = [];
  const words = str.split(/\s+/);
  let current = "";
  for (const w of words) {
    const candidate = current ? current + " " + w : w;
    if (candidate.length <= maxLength) {
      current = candidate;
    } else {
      if (current) result.push(current);
      if (w.length > maxLength) {
        for (let i = 0; i < w.length; i += maxLength) {
          result.push(w.slice(i, i + maxLength));
        }
        current = "";
      } else {
        current = w;
      }
    }
  }
  if (current) result.push(current);
  return result;
}

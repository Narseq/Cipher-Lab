import { CipherError, ciphers } from '@/lib/ciphers';
import type { CipherOptions } from '@/lib/ciphers';
import { languageScore } from './language';

export interface SolverResult {
  cipherId: string;
  options: CipherOptions;
  plaintext: string;
  /** 0..1, how likely this is the intended reading. */
  confidence: number;
}

const MIN_CONFIDENCE = 0.2;
const MAX_RESULTS = 8;

/** Tries every known cipher on `text` and returns the most plausible readings, best first. */
export function analyzeText(text: string): SolverResult[] {
  if (text.trim() === '') return [];

  const bestByPlaintext = new Map<string, SolverResult>();
  for (const cipher of ciphers) {
    const detected = cipher.detect(text);
    let candidates;
    try {
      candidates = cipher.candidates(text);
    } catch (error) {
      if (error instanceof CipherError) continue;
      throw error;
    }
    for (const { options, plaintext } of candidates) {
      if (plaintext === text) continue;
      const confidence = languageScore(plaintext) * (0.5 + 0.5 * detected);
      const known = bestByPlaintext.get(plaintext);
      if (confidence >= MIN_CONFIDENCE && (!known || confidence > known.confidence)) {
        bestByPlaintext.set(plaintext, { cipherId: cipher.id, options, plaintext, confidence });
      }
    }
  }

  return [...bestByPlaintext.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_RESULTS);
}

import { z } from 'zod';
import { bestShift, indexOfCoincidence, languageScore } from '@/lib/analysis/language';
import { defineCipher } from './define';
import { lettersRatio } from './utils';

const optionsSchema = z.object({ key: z.string().regex(/^[a-z]{1,32}$/i) });

const MIN_LETTERS = 20;
const MAX_KEY_LENGTH = 12;
const CANDIDATE_LENGTHS = 3;
const REFINE_PASSES = 2;

function transform(text: string, key: string, direction: 1 | -1): string {
  const shifts = [...key.toUpperCase()].map((char) => char.charCodeAt(0) - 65);
  let position = 0;
  return text.replace(/[a-z]/gi, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const shift = (shifts[position++ % shifts.length] ?? 0) * direction;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

/** Splits the letters of `text` into the columns a key of `length` would have shifted alike. */
function columns(letters: string, length: number): string[] {
  return Array.from({ length }, (_, offset) =>
    [...letters].filter((_, index) => index % length === offset).join(''),
  );
}

/** Tunes each key letter in turn so the whole decryption reads as natural language. */
function refineKey(text: string, key: string): string {
  const letters = [...key];
  for (let pass = 0; pass < REFINE_PASSES; pass++) {
    letters.forEach((current, position) => {
      let best = current;
      let bestScore = -1;
      for (let shift = 0; shift < 26; shift++) {
        const letter = String.fromCharCode(65 + shift);
        const trial = letters.map((l, i) => (i === position ? letter : l)).join('');
        const score = languageScore(transform(text, trial, -1));
        if (score > bestScore) {
          bestScore = score;
          best = letter;
        }
      }
      letters[position] = best;
    });
  }
  return letters.join('');
}

/** Key lengths ranked by average index of coincidence, preferring the shorter of near-equals. */
function likelyKeyLengths(letters: string): number[] {
  const maxLength = Math.min(MAX_KEY_LENGTH, Math.floor(letters.length / 4));
  const scored = Array.from({ length: Math.max(0, maxLength - 1) }, (_, i) => {
    const length = i + 2;
    const cols = columns(letters, length);
    const average = cols.reduce((sum, col) => sum + indexOfCoincidence(col), 0) / cols.length;
    return { length, average };
  });
  const best = Math.max(0, ...scored.map((entry) => entry.average));
  return scored
    .filter((entry) => entry.average >= best * 0.85)
    .sort((a, b) => a.length - b.length)
    .slice(0, CANDIDATE_LENGTHS)
    .map((entry) => entry.length);
}

export default defineCipher({
  id: 'vigenere',
  name: 'Vigenère',
  description: 'ciphers.vigenere.description',
  difficulty: 'medium',
  options: [{ name: 'key', type: 'text', default: 'LEMON', maxLength: 32 }],
  optionsSchema,
  encrypt: (text, { key }) => transform(text, key, 1),
  decrypt: (text, { key }) => transform(text, key, -1),
  detect: (text) => lettersRatio(text) * 0.5,
  candidates: (text) => {
    const letters = text.replace(/[^a-z]/gi, '');
    if (letters.length < MIN_LETTERS) return [];
    return likelyKeyLengths(letters).map((length) => {
      const initialKey = columns(letters, length)
        .map((column) => String.fromCharCode(65 + bestShift(column)))
        .join('');
      const key = refineKey(text, initialKey);
      return { options: { key }, plaintext: transform(text, key, -1) };
    });
  },
});

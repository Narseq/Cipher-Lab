/** Letter frequencies (%) of A-Z, with Polish diacritics folded onto their base letters. */
const FREQUENCIES = {
  en: [
    8.17, 1.49, 2.78, 4.25, 12.7, 2.23, 2.02, 6.09, 6.97, 0.15, 0.77, 4.03, 2.41, 6.75, 7.51, 1.93,
    0.1, 5.99, 6.33, 9.06, 2.76, 0.98, 2.36, 0.15, 1.97, 0.07,
  ],
  pl: [
    9.9, 1.47, 4.4, 3.25, 8.8, 0.3, 1.42, 1.08, 8.21, 2.28, 3.51, 3.9, 2.8, 5.7, 8.6, 3.13, 0.0,
    4.69, 5.0, 3.98, 2.5, 0.01, 4.65, 0.0, 3.76, 6.9,
  ],
} as const;

const COMMON_WORDS = new Set([
  // English
  ...'the and is to of in it that you for with this are was have not but be on as at by we or from hello world secret message code key answer find what who why how when where there their they will can all one our out'.split(
    ' ',
  ),
  // Polish, diacritics folded
  ...'i w nie na to jest sie z do ze jak co ale po tak za od czy dla moze ten tego tym ona oni my wy ja ty tu tam kto gdzie kiedy dlaczego haslo kod tajne wiadomosc witaj swiat'.split(
    ' ',
  ),
]);

/** Lowercases, strips diacritics (including the stroked l) so only A-Z letters remain letters. */
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase();
}

export function letterCounts(text: string): number[] {
  const counts = new Array<number>(26).fill(0);
  for (const char of foldText(text)) {
    const index = char.charCodeAt(0) - 97;
    if (index >= 0 && index < 26) counts[index] = (counts[index] ?? 0) + 1;
  }
  return counts;
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}

/** Best similarity of the letter distribution to English or Polish, in 0..1. */
export function frequencySimilarity(counts: readonly number[]): number {
  return Math.max(
    cosineSimilarity(counts, FREQUENCIES.en),
    cosineSimilarity(counts, FREQUENCIES.pl),
  );
}

/** Shift (0..25) that, applied to a Caesar-encrypted column, makes it look most like a language. */
export function bestShift(column: string): number {
  const counts = letterCounts(column);
  let best = 0;
  let bestScore = -1;
  for (let shift = 0; shift < 26; shift++) {
    const shifted = counts.map((_, i) => counts[(i + shift) % 26] ?? 0);
    const score = frequencySimilarity(shifted);
    if (score > bestScore) {
      bestScore = score;
      best = shift;
    }
  }
  return best;
}

/** Index of coincidence of the A-Z letters in `text`; about 0.065 for natural language. */
export function indexOfCoincidence(text: string): number {
  const counts = letterCounts(text);
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total < 2) return 0;
  return counts.reduce((sum, n) => sum + n * (n - 1), 0) / (total * (total - 1));
}

/** How much `text` looks like natural English or Polish prose, in 0..1. */
export function languageScore(text: string): number {
  const visible = text.replace(/\s/g, '');
  if (visible.length === 0) return 0;

  const printable = [...visible].filter((c) => c !== '�' && !/\p{Cc}/u.test(c)).length;
  const printableShare = printable / visible.length;
  if (printableShare < 0.95) return 0;

  const counts = letterCounts(text);
  const letters = counts.reduce((sum, n) => sum + n, 0);
  const lettersShare = Math.min(1, letters / visible.length / 0.7);

  const frequencyScore = Math.min(1, Math.max(0, (frequencySimilarity(counts) - 0.75) / 0.23));
  const words = foldText(text).match(/[a-z]+/g) ?? [];
  const wordHits = words.filter((word) => COMMON_WORDS.has(word)).length;
  const wordScore = words.length === 0 ? 0 : Math.min(1, (wordHits / words.length) * 2);

  return lettersShare * (0.6 * frequencyScore + 0.4 * wordScore);
}

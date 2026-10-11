import { letterCounts } from './language';

export interface TextStats {
  characters: number;
  words: number;
  digits: number;
  special: number;
}

export interface LetterFrequency {
  letter: string;
  count: number;
  percent: number;
}

export function textStats(text: string): TextStats {
  const chars = [...text];
  return {
    characters: chars.length,
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    digits: chars.filter((c) => /\p{Nd}/u.test(c)).length,
    special: chars.filter((c) => !/[\p{L}\p{Nd}\s]/u.test(c)).length,
  };
}

/** Frequency of every A-Z letter; diacritics count towards their base letter. */
export function letterFrequencies(text: string): LetterFrequency[] {
  const counts = letterCounts(text);
  const total = counts.reduce((sum, n) => sum + n, 0);
  return counts.map((count, index) => ({
    letter: String.fromCharCode(65 + index),
    count,
    percent: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
  }));
}

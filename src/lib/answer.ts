import { foldText } from '@/lib/analysis/language';

/** Case, accent, punctuation and spacing insensitive form used to compare answers. */
export function normalizeAnswer(answer: string): string {
  return foldText(answer)
    .replace(/[^\p{L}\p{Nd}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

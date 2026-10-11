import type { Difficulty } from '@/lib/ciphers';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

const BASE_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 350,
  expert: 500,
};

/** Share of the base points each revealed hint costs. */
export const HINT_PENALTY = 0.25;
/** A solved puzzle always pays at least this share of the base points. */
const MIN_SHARE = 0.1;

export const MAX_HINTS = 3;

export function difficultyRank(difficulty: Difficulty): number {
  return DIFFICULTIES.indexOf(difficulty) + 1;
}

export function pointsFor(difficulty: Difficulty, hintsUsed: number): number {
  const base = BASE_POINTS[difficulty];
  return Math.max(Math.round(base * MIN_SHARE), Math.round(base * (1 - HINT_PENALTY * hintsUsed)));
}

export const SPEED_SOLVER_SECONDS = 60;

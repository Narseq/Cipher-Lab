import { SPEED_SOLVER_SECONDS } from '@/lib/scoring';

/** Codes double as translation keys: `badges.<code>.name` and `badges.<code>.description`. */
export const ACHIEVEMENT_CODES = [
  'firstSolve',
  'cipherMaster',
  'noHints',
  'speedSolver',
  'weekStreak',
  'creator',
] as const;

export type AchievementCode = (typeof ACHIEVEMENT_CODES)[number];

export interface AchievementStats {
  solved: number;
  solvedWithoutHints: number;
  distinctCiphersSolved: number;
  fastestSolveSeconds: number | null;
  longestStreak: number;
  created: number;
}

export const CIPHER_MASTER_CIPHERS = 5;
export const NO_HINTS_SOLVES = 5;
export const WEEK_STREAK_DAYS = 7;

export function earnedAchievements(stats: AchievementStats): AchievementCode[] {
  const earned: Record<AchievementCode, boolean> = {
    firstSolve: stats.solved >= 1,
    cipherMaster: stats.distinctCiphersSolved >= CIPHER_MASTER_CIPHERS,
    noHints: stats.solvedWithoutHints >= NO_HINTS_SOLVES,
    speedSolver:
      stats.fastestSolveSeconds !== null && stats.fastestSolveSeconds <= SPEED_SOLVER_SECONDS,
    weekStreak: stats.longestStreak >= WEEK_STREAK_DAYS,
    creator: stats.created >= 1,
  };
  return ACHIEVEMENT_CODES.filter((code) => earned[code]);
}

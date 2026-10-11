import type { CipherOptions, Difficulty } from '@/lib/ciphers';
import type { Locale } from '@/i18n/routing';

/** Types shared by services, API routes and client components. */

export interface PuzzleSummary {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  cipherId: string;
  tags: string[];
  solveCount: number;
  attemptCount: number;
  /** Mean time of the successful solves, null until someone solves it. */
  averageSolveSeconds: number | null;
  createdAt: string;
  author: string;
  /** Language the text is shown in; differs from the requested one when it was missing. */
  textLocale: Locale;
  isFallback: boolean;
}

export interface PuzzleDetail extends PuzzleSummary {
  ciphertext: string;
  maxAttempts: number | null;
  timeLimitSeconds: number | null;
  hintCount: number;
}

export interface PuzzlePage {
  items: PuzzleSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RevealedHint {
  position: number;
  text: string;
}

export interface SolveResult {
  points: number;
  elapsedSeconds: number;
  attempts: number;
  hintsUsed: number;
  plaintext: string;
  explanation: string;
  cipherId: string;
  cipherOptions: CipherOptions;
  newBadges: string[];
  streak: number;
}

export interface PlayState {
  startedAt: string;
  attemptsUsed: number;
  hints: RevealedHint[];
  expired: boolean;
  result: SolveResult | null;
}

export interface SubmissionOutcome {
  correct: boolean;
  attemptsUsed: number;
  result: SolveResult | null;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'global';

export interface LeaderboardRow {
  rank: number;
  username: string;
  points: number;
  solved: number;
}

export interface ProfileData {
  username: string;
  joinedAt: string;
  totalPoints: number;
  solvedCount: number;
  currentStreak: number;
  longestStreak: number;
  badges: { code: string; earnedAt: string }[];
  solved: {
    puzzleId: string;
    title: string;
    points: number;
    elapsedSeconds: number;
    solvedAt: string;
  }[];
  created: PuzzleSummary[];
}

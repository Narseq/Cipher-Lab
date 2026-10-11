import type { Locale } from '@/i18n/routing';
import { ApiError } from '@/lib/api';
import { getCipher, type CipherOptions, type Difficulty } from '@/lib/ciphers';
import { db } from '@/lib/db';
import { localizeText } from '@/lib/puzzle-text';
import { allow } from '@/lib/rate-limit';
import { pointsFor } from '@/lib/scoring';
import type { PlayState, RevealedHint, SolveResult, SubmissionOutcome } from '@/lib/types';
import { grantAchievements } from './achievements';
import { hashAnswer } from './puzzles';

const SUBMIT_LIMIT = 10;
const SUBMIT_WINDOW_MS = 60_000;

const DAY_MS = 24 * 60 * 60 * 1000;
const utcDay = (date: Date) => date.toISOString().slice(0, 10);

async function loadPuzzle(id: string, locale: Locale) {
  const puzzle = await db.puzzle.findUnique({
    where: { id },
    select: {
      id: true,
      difficulty: true,
      cipherId: true,
      cipherOptions: true,
      ciphertext: true,
      answerHash: true,
      maxAttempts: true,
      timeLimitSeconds: true,
      translations: {
        where: { OR: [{ locale }, { isOriginal: true }] },
        select: {
          locale: true,
          isOriginal: true,
          title: true,
          description: true,
          explanation: true,
          hints: true,
        },
      },
    },
  });
  if (!puzzle) throw new ApiError('notFound');
  return puzzle;
}

type LoadedPuzzle = Awaited<ReturnType<typeof loadPuzzle>>;

function isExpired(startedAt: Date, timeLimitSeconds: number | null, now = Date.now()): boolean {
  return timeLimitSeconds !== null && now > startedAt.getTime() + timeLimitSeconds * 1000;
}

/** The decrypted message, recovered from the stored ciphertext. */
function revealPlaintext(puzzle: LoadedPuzzle, fallback: string): string {
  const cipher = getCipher(puzzle.cipherId);
  const options = puzzle.cipherOptions as CipherOptions;
  try {
    return cipher ? cipher.decrypt(puzzle.ciphertext, options) : fallback;
  } catch {
    return fallback;
  }
}

async function buildResult(
  userId: string,
  puzzle: LoadedPuzzle,
  locale: Locale,
  newBadges: string[],
): Promise<SolveResult> {
  const [entry, user] = await Promise.all([
    db.leaderboardEntry.findUniqueOrThrow({
      where: { userId_puzzleId: { userId, puzzleId: puzzle.id } },
    }),
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { currentStreak: true } }),
  ]);
  return {
    points: entry.points,
    elapsedSeconds: entry.elapsedSeconds,
    attempts: entry.attempts,
    hintsUsed: entry.hintsUsed,
    plaintext: revealPlaintext(puzzle, ''),
    explanation: localizeText(puzzle.translations, locale).explanation,
    cipherId: puzzle.cipherId,
    cipherOptions: puzzle.cipherOptions as CipherOptions,
    newBadges,
    streak: user.currentStreak,
  };
}

async function ensureProgress(userId: string, puzzleId: string) {
  return db.puzzleProgress.upsert({
    where: { userId_puzzleId: { userId, puzzleId } },
    create: { userId, puzzleId },
    update: {},
  });
}

/** Starts (or resumes) a player's run; the server-side start time drives the timer. */
export async function startPuzzle(
  userId: string,
  puzzleId: string,
  locale: Locale,
): Promise<PlayState> {
  const puzzle = await loadPuzzle(puzzleId, locale);
  const progress = await ensureProgress(userId, puzzleId);
  const used = await db.hint.findMany({
    where: { userId, puzzleId },
    orderBy: { position: 'asc' },
    select: { position: true },
  });
  const texts = localizeText(puzzle.translations, locale).hints;
  const hints: RevealedHint[] = used.flatMap(({ position }) => {
    const text = texts[position - 1];
    return text === undefined ? [] : [{ position, text }];
  });

  return {
    startedAt: progress.startedAt.toISOString(),
    attemptsUsed: progress.attempts,
    hints,
    expired: !progress.solvedAt && isExpired(progress.startedAt, puzzle.timeLimitSeconds),
    result: progress.solvedAt ? await buildResult(userId, puzzle, locale, []) : null,
  };
}

export async function revealHint(
  userId: string,
  puzzleId: string,
  position: number,
  locale: Locale,
): Promise<RevealedHint> {
  const puzzle = await loadPuzzle(puzzleId, locale);
  const texts = localizeText(puzzle.translations, locale).hints;
  const text = texts[position - 1];
  if (text === undefined) throw new ApiError('notFound');

  const progress = await ensureProgress(userId, puzzleId);
  if (progress.solvedAt) throw new ApiError('alreadySolved');
  if (isExpired(progress.startedAt, puzzle.timeLimitSeconds)) throw new ApiError('timeUp');

  const used = await db.hint.count({ where: { userId, puzzleId } });
  const alreadyRevealed = position <= used;
  if (!alreadyRevealed) {
    if (position !== used + 1) throw new ApiError('hintOrder');
    await db.hint.create({ data: { userId, puzzleId, position } });
  }
  return { position, text };
}

export async function submitAnswer(
  userId: string,
  puzzleId: string,
  answer: string,
  locale: Locale,
): Promise<SubmissionOutcome> {
  if (!allow(`submit:${userId}:${puzzleId}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS)) {
    throw new ApiError('rateLimited');
  }

  const puzzle = await loadPuzzle(puzzleId, locale);
  const progress = await ensureProgress(userId, puzzleId);
  if (progress.solvedAt) throw new ApiError('alreadySolved');
  if (puzzle.maxAttempts !== null && progress.attempts >= puzzle.maxAttempts) {
    throw new ApiError('attemptsExhausted');
  }
  const now = new Date();
  if (isExpired(progress.startedAt, puzzle.timeLimitSeconds, now.getTime())) {
    throw new ApiError('timeUp');
  }

  const correct = hashAnswer(answer) === puzzle.answerHash;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - progress.startedAt.getTime()) / 1000),
  );
  const attemptNumber = progress.attempts + 1;

  await db.$transaction(async (tx) => {
    const hintsUsed = await tx.hint.count({ where: { userId, puzzleId } });
    await tx.submission.create({
      data: { userId, puzzleId, attemptNumber, isCorrect: correct, elapsedSeconds, hintsUsed },
    });
    await tx.puzzleProgress.update({
      where: { userId_puzzleId: { userId, puzzleId } },
      data: { attempts: attemptNumber, ...(correct && { solvedAt: now }) },
    });
    await tx.puzzle.update({
      where: { id: puzzleId },
      data: {
        attemptCount: { increment: 1 },
        ...(correct && {
          solveCount: { increment: 1 },
          totalSolveSeconds: { increment: elapsedSeconds },
        }),
      },
    });
    if (!correct) return;

    await tx.leaderboardEntry.create({
      data: {
        userId,
        puzzleId,
        points: pointsFor(puzzle.difficulty as Difficulty, hintsUsed),
        elapsedSeconds,
        hintsUsed,
        attempts: attemptNumber,
        solvedAt: now,
      },
    });
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastSolveDay: true },
    });
    const today = utcDay(now);
    if (user.lastSolveDay !== today) {
      const continues = user.lastSolveDay === utcDay(new Date(now.getTime() - DAY_MS));
      const currentStreak = continues ? user.currentStreak + 1 : 1;
      await tx.user.update({
        where: { id: userId },
        data: {
          currentStreak,
          longestStreak: Math.max(user.longestStreak, currentStreak),
          lastSolveDay: today,
        },
      });
    }
  });

  if (!correct) return { correct: false, attemptsUsed: attemptNumber, result: null };

  const badges = await grantAchievements(userId);
  return {
    correct: true,
    attemptsUsed: attemptNumber,
    result: await buildResult(userId, puzzle, locale, badges),
  };
}

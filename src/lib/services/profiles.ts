import type { Locale } from '@/i18n/routing';
import { db } from '@/lib/db';
import { localizeText } from '@/lib/puzzle-text';
import type { ProfileData } from '@/lib/types';
import { toSummary } from './puzzles';

export async function getProfile(username: string, locale: Locale): Promise<ProfileData | null> {
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      createdAt: true,
      currentStreak: true,
      longestStreak: true,
    },
  });
  if (!user) return null;

  const translations = {
    where: { OR: [{ locale }, { isOriginal: true }] },
    select: { locale: true, isOriginal: true, title: true, description: true, hints: true },
  };

  const [entries, badges, created] = await Promise.all([
    db.leaderboardEntry.findMany({
      where: { userId: user.id },
      orderBy: { solvedAt: 'desc' },
      select: {
        puzzleId: true,
        points: true,
        elapsedSeconds: true,
        solvedAt: true,
        puzzle: { select: { translations } },
      },
    }),
    db.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: 'asc' },
      select: { earnedAt: true, achievement: { select: { code: true } } },
    }),
    db.puzzle.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        difficulty: true,
        cipherId: true,
        solveCount: true,
        attemptCount: true,
        totalSolveSeconds: true,
        createdAt: true,
        author: { select: { username: true } },
        tags: { select: { tag: { select: { name: true } } } },
        translations,
      },
    }),
  ]);

  return {
    username: user.username,
    joinedAt: user.createdAt.toISOString(),
    totalPoints: entries.reduce((sum, entry) => sum + entry.points, 0),
    solvedCount: entries.length,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    badges: badges.map((row) => ({
      code: row.achievement.code,
      earnedAt: row.earnedAt.toISOString(),
    })),
    solved: entries.map((entry) => ({
      puzzleId: entry.puzzleId,
      title: localizeText(entry.puzzle.translations, locale).title,
      points: entry.points,
      elapsedSeconds: entry.elapsedSeconds,
      solvedAt: entry.solvedAt.toISOString(),
    })),
    created: created.map((row) => toSummary(row, locale)),
  };
}

import { ACHIEVEMENT_CODES, earnedAchievements, type AchievementStats } from '@/lib/achievements';
import { db } from '@/lib/db';

async function loadStats(userId: string): Promise<AchievementStats> {
  const [entries, user, created] = await Promise.all([
    db.leaderboardEntry.findMany({
      where: { userId },
      select: { hintsUsed: true, elapsedSeconds: true, puzzle: { select: { cipherId: true } } },
    }),
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { longestStreak: true } }),
    db.puzzle.count({ where: { authorId: userId } }),
  ]);
  return {
    solved: entries.length,
    solvedWithoutHints: entries.filter((entry) => entry.hintsUsed === 0).length,
    distinctCiphersSolved: new Set(entries.map((entry) => entry.puzzle.cipherId)).size,
    fastestSolveSeconds: entries.length
      ? Math.min(...entries.map((entry) => entry.elapsedSeconds))
      : null,
    longestStreak: user.longestStreak,
    created,
  };
}

/** Grants every badge the user now qualifies for and returns the codes that are new. */
export async function grantAchievements(userId: string): Promise<string[]> {
  const earned = earnedAchievements(await loadStats(userId));
  const owned = await db.userAchievement.findMany({
    where: { userId },
    select: { achievement: { select: { code: true } } },
  });
  const ownedCodes = new Set(owned.map((row) => row.achievement.code));
  const fresh = earned.filter((code) => !ownedCodes.has(code));

  for (const code of fresh) {
    const achievement = await db.achievement.upsert({
      where: { code },
      create: { code },
      update: {},
    });
    await db.userAchievement.create({ data: { userId, achievementId: achievement.id } });
  }
  return fresh;
}

/** Makes sure every achievement row exists, e.g. after a fresh database. */
export async function ensureAchievements(): Promise<void> {
  for (const code of ACHIEVEMENT_CODES) {
    await db.achievement.upsert({ where: { code }, create: { code }, update: {} });
  }
}

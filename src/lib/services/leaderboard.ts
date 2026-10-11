import { db } from '@/lib/db';
import type { LeaderboardPeriod, LeaderboardRow } from '@/lib/types';

export const LEADERBOARD_SIZE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the period in UTC: today's midnight, this week's Monday, or null for all time. */
export function periodStart(period: LeaderboardPeriod, now = new Date()): Date | null {
  if (period === 'global') return null;
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (period === 'daily') return midnight;
  const sinceMonday = (midnight.getUTCDay() + 6) % 7;
  return new Date(midnight.getTime() - sinceMonday * DAY_MS);
}

export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardRow[]> {
  const since = periodStart(period);
  const groups = await db.leaderboardEntry.groupBy({
    by: ['userId'],
    where: since ? { solvedAt: { gte: since } } : {},
    _sum: { points: true },
    _count: { _all: true },
    orderBy: [{ _sum: { points: 'desc' } }, { userId: 'asc' }],
    take: LEADERBOARD_SIZE,
  });
  const users = await db.user.findMany({
    where: { id: { in: groups.map((group) => group.userId) } },
    select: { id: true, username: true },
  });
  const names = new Map(users.map((user) => [user.id, user.username]));

  return groups.map((group, index) => ({
    rank: index + 1,
    username: names.get(group.userId) ?? '?',
    points: group._sum.points ?? 0,
    solved: group._count._all,
  }));
}

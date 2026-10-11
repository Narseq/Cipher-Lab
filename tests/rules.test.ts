import { describe, expect, it } from 'vitest';
import { earnedAchievements, type AchievementStats } from '@/lib/achievements';
import { alternatesFor } from '@/lib/seo';
import { allow, resetRateLimits } from '@/lib/rate-limit';
import { difficultyRank, pointsFor } from '@/lib/scoring';
import { periodStart } from '@/lib/services/leaderboard';
import { localizeText } from '@/lib/puzzle-text';
import { formatDuration } from '@/lib/utils';

describe('scoring', () => {
  it('pays more for harder puzzles', () => {
    expect(pointsFor('easy', 0)).toBe(100);
    expect(pointsFor('medium', 0)).toBe(200);
    expect(pointsFor('hard', 0)).toBe(350);
    expect(pointsFor('expert', 0)).toBe(500);
  });

  it('takes 25% off per hint but never less than 10%', () => {
    expect(pointsFor('medium', 1)).toBe(150);
    expect(pointsFor('medium', 3)).toBe(50);
    expect(pointsFor('medium', 10)).toBe(20);
  });

  it('ranks difficulties from 1 to 4', () => {
    expect(['easy', 'medium', 'hard', 'expert'].map((d) => difficultyRank(d as 'easy'))).toEqual([
      1, 2, 3, 4,
    ]);
  });
});

describe('achievements', () => {
  const none: AchievementStats = {
    solved: 0,
    solvedWithoutHints: 0,
    distinctCiphersSolved: 0,
    fastestSolveSeconds: null,
    longestStreak: 0,
    created: 0,
  };

  it('awards nothing to a new user', () => {
    expect(earnedAchievements(none)).toEqual([]);
  });

  it('awards each badge at its threshold', () => {
    expect(earnedAchievements({ ...none, solved: 1 })).toEqual(['firstSolve']);
    expect(earnedAchievements({ ...none, distinctCiphersSolved: 5 })).toContain('cipherMaster');
    expect(earnedAchievements({ ...none, solvedWithoutHints: 4 })).not.toContain('noHints');
    expect(earnedAchievements({ ...none, solvedWithoutHints: 5 })).toContain('noHints');
    expect(earnedAchievements({ ...none, fastestSolveSeconds: 60 })).toContain('speedSolver');
    expect(earnedAchievements({ ...none, fastestSolveSeconds: 61 })).not.toContain('speedSolver');
    expect(earnedAchievements({ ...none, longestStreak: 7 })).toContain('weekStreak');
    expect(earnedAchievements({ ...none, created: 1 })).toContain('creator');
  });
});

describe('leaderboard periods', () => {
  const wednesday = new Date('2026-10-14T15:30:00Z');

  it('starts the day at UTC midnight', () => {
    expect(periodStart('daily', wednesday)?.toISOString()).toBe('2026-10-14T00:00:00.000Z');
  });

  it('starts the week on Monday', () => {
    expect(periodStart('weekly', wednesday)?.toISOString()).toBe('2026-10-12T00:00:00.000Z');
    expect(periodStart('weekly', new Date('2026-10-18T23:59:00Z'))?.toISOString()).toBe(
      '2026-10-12T00:00:00.000Z',
    );
  });

  it('has no start for the global ranking', () => {
    expect(periodStart('global')).toBeNull();
  });
});

describe('rate limiter', () => {
  it('blocks after the limit and recovers after the window', () => {
    resetRateLimits();
    expect([1, 2, 3].map(() => allow('k', 3, 1000, 0))).toEqual([true, true, true]);
    expect(allow('k', 3, 1000, 10)).toBe(false);
    expect(allow('other', 3, 1000, 10)).toBe(true);
    expect(allow('k', 3, 1000, 1001)).toBe(true);
  });
});

describe('puzzle text', () => {
  const rows = [
    { locale: 'pl', isOriginal: true, title: 'Tytuł', description: 'Opis', hints: ['a'] },
    { locale: 'en', isOriginal: false, title: 'Title', description: 'Desc', hints: ['b'] },
  ];

  it('prefers the requested language', () => {
    expect(localizeText(rows, 'en')).toMatchObject({ title: 'Title', isFallback: false });
  });

  it('falls back to the original and says so', () => {
    expect(localizeText([rows[0]!], 'en')).toMatchObject({
      title: 'Tytuł',
      locale: 'pl',
      isFallback: true,
      hints: ['a'],
    });
  });
});

describe('seo', () => {
  it('builds canonical and hreflang links for both languages', () => {
    const alternates = alternatesFor('/solver', 'pl');
    expect(alternates?.canonical).toMatch(/\/pl\/solver$/);
    expect(alternates?.languages).toMatchObject({
      en: expect.stringMatching(/\/en\/solver$/),
      pl: expect.stringMatching(/\/pl\/solver$/),
      'x-default': expect.stringMatching(/\/en\/solver$/),
    });
  });
});

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(3725)).toBe('1:02:05');
  });
});

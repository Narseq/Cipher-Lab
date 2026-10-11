import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import { resetRateLimits } from '@/lib/rate-limit';
import { getLeaderboard } from '@/lib/services/leaderboard';
import { revealHint, startPuzzle, submitAnswer } from '@/lib/services/play';
import { createPuzzle, getPuzzle, listPuzzles } from '@/lib/services/puzzles';
import { getProfile } from '@/lib/services/profiles';
import { registerUser, verifyLogin } from '@/lib/services/users';
import { createPuzzleSchema, puzzleListQuerySchema } from '@/lib/validation/puzzle';

async function newUser(name: string) {
  return registerUser({ email: `${name}@example.com`, username: name, password: 'correct horse' });
}

function puzzleInput(overrides: Record<string, unknown> = {}) {
  return createPuzzleSchema.parse({
    cipherId: 'caesar',
    cipherOptions: { shift: 3 },
    plaintext: 'Meet me at midnight',
    difficulty: 'medium',
    maxAttempts: 3,
    timeLimitSeconds: null,
    originalLocale: 'en',
    translations: {
      en: {
        title: 'Midnight meeting',
        description: 'Where and when?',
        explanation: 'A plain Caesar shift by three.',
        hints: ['It is a classic', 'Shift by a small number'],
      },
      pl: {
        title: 'Spotkanie o północy',
        description: 'Gdzie i kiedy?',
        hints: ['To klasyk', 'Przesunięcie o małą liczbę'],
      },
    },
    tags: ['story', 'Beginner'],
    ...overrides,
  });
}

beforeEach(async () => {
  resetRateLimits();
  await db.leaderboardEntry.deleteMany();
  await db.puzzle.deleteMany();
  await db.user.deleteMany();
});

describe('accounts', () => {
  it('registers, rejects duplicates and verifies logins', async () => {
    const user = await newUser('ada');
    expect(user.username).toBe('ada');
    await expect(newUser('ada')).rejects.toMatchObject({ code: 'emailTaken' });
    await expect(
      registerUser({ email: 'other@example.com', username: 'ada', password: 'correct horse' }),
    ).rejects.toMatchObject({ code: 'usernameTaken' });

    const login = await verifyLogin({ email: 'ADA@example.com', password: 'correct horse' });
    expect(login.id).toBe(user.id);
    await expect(
      verifyLogin({ email: 'ada@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      code: 'invalidCredentials',
    });
    await expect(
      verifyLogin({ email: 'nobody@example.com', password: 'whatever' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('never stores the plain password', async () => {
    const user = await newUser('grace');
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.passwordHash).not.toContain('correct horse');
  });
});

describe('creating and solving a puzzle', () => {
  it('runs the whole flow: create, start, hint, wrong answer, solve, rank', async () => {
    const author = await newUser('author');
    const player = await newUser('player');

    const id = await createPuzzle(author.id, puzzleInput());
    const detail = await getPuzzle(id, 'en');
    expect(detail).toMatchObject({
      title: 'Midnight meeting',
      ciphertext: 'Phhw ph dw plgqljkw',
      difficulty: 'medium',
      hintCount: 2,
      tags: ['beginner', 'story'],
    });
    expect(JSON.stringify(detail)).not.toContain('Meet me');

    const started = await startPuzzle(player.id, id, 'en');
    expect(started).toMatchObject({ attemptsUsed: 0, hints: [], expired: false, result: null });

    await expect(revealHint(player.id, id, 2, 'en')).rejects.toMatchObject({ code: 'hintOrder' });
    await expect(revealHint(player.id, id, 1, 'pl')).resolves.toEqual({
      position: 1,
      text: 'To klasyk',
    });

    const wrong = await submitAnswer(player.id, id, 'Meet me at noon', 'en');
    expect(wrong).toEqual({ correct: false, attemptsUsed: 1, result: null });

    const right = await submitAnswer(player.id, id, '  meet ME at midnight! ', 'en');
    expect(right.correct).toBe(true);
    expect(right.result).toMatchObject({
      points: 150, // 200 base minus one hint (25%)
      attempts: 2,
      hintsUsed: 1,
      plaintext: 'Meet me at midnight',
      explanation: 'A plain Caesar shift by three.',
      cipherId: 'caesar',
      cipherOptions: { shift: 3 },
      streak: 1,
    });
    expect(right.result?.newBadges).toContain('firstSolve');

    await expect(submitAnswer(player.id, id, 'again', 'en')).rejects.toMatchObject({
      code: 'alreadySolved',
    });

    const stats = await getPuzzle(id, 'en');
    expect(stats).toMatchObject({ solveCount: 1, attemptCount: 2 });

    const board = await getLeaderboard('global');
    expect(board).toEqual([{ rank: 1, username: 'player', points: 150, solved: 1 }]);
    expect(await getLeaderboard('daily')).toHaveLength(1);

    const profile = await getProfile('player', 'pl');
    expect(profile).toMatchObject({ totalPoints: 150, solvedCount: 1, currentStreak: 1 });
    expect(profile?.solved[0]?.title).toBe('Spotkanie o północy');
    expect(profile?.badges.map((badge) => badge.code)).toContain('firstSolve');
    expect((await getProfile('author', 'en'))?.badges.map((b) => b.code)).toContain('creator');
  });

  it('resumes a solved puzzle with its result', async () => {
    const author = await newUser('author');
    const player = await newUser('player');
    const id = await createPuzzle(author.id, puzzleInput());
    await startPuzzle(player.id, id, 'en');
    await submitAnswer(player.id, id, 'Meet me at midnight', 'en');
    const state = await startPuzzle(player.id, id, 'en');
    expect(state.result).toMatchObject({ hintsUsed: 0, points: 200 });
  });

  it('stops after the maximum number of attempts', async () => {
    const author = await newUser('author');
    const player = await newUser('player');
    const id = await createPuzzle(author.id, puzzleInput({ maxAttempts: 2 }));
    await submitAnswer(player.id, id, 'a', 'en');
    await submitAnswer(player.id, id, 'b', 'en');
    await expect(submitAnswer(player.id, id, 'c', 'en')).rejects.toMatchObject({
      code: 'attemptsExhausted',
    });
  });

  it('enforces the time limit on the server clock', async () => {
    const author = await newUser('author');
    const player = await newUser('player');
    const id = await createPuzzle(author.id, puzzleInput({ timeLimitSeconds: 60 }));
    await startPuzzle(player.id, id, 'en');
    await db.puzzleProgress.updateMany({
      data: { startedAt: new Date(Date.now() - 120_000) },
    });
    expect((await startPuzzle(player.id, id, 'en')).expired).toBe(true);
    await expect(submitAnswer(player.id, id, 'x', 'en')).rejects.toMatchObject({ code: 'timeUp' });
    await expect(revealHint(player.id, id, 1, 'en')).rejects.toMatchObject({ code: 'timeUp' });
  });

  it('rate limits rapid guessing', async () => {
    const author = await newUser('author');
    const player = await newUser('player');
    const id = await createPuzzle(author.id, puzzleInput({ maxAttempts: null }));
    for (let i = 0; i < 10; i++) await submitAnswer(player.id, id, `guess ${i}`, 'en');
    await expect(submitAnswer(player.id, id, 'one more', 'en')).rejects.toMatchObject({
      code: 'rateLimited',
    });
  });

  it('reports unsupported characters as a validation error', async () => {
    const author = await newUser('author');
    await expect(
      createPuzzle(
        author.id,
        puzzleInput({ cipherId: 'a1z26', cipherOptions: {}, plaintext: 'hi!' }),
      ),
    ).rejects.toMatchObject({
      code: 'validation',
      issues: { plaintext: 'cipherUnsupportedCharacter' },
    });
  });
});

describe('gallery', () => {
  it('shows text in the requested language and falls back to the original', async () => {
    const author = await newUser('author');
    await createPuzzle(
      author.id,
      puzzleInput({
        originalLocale: 'pl',
        translations: {
          pl: { title: 'Tylko po polsku', description: 'Opis', hints: [] },
        },
      }),
    );
    const page = await listPuzzles(puzzleListQuerySchema.parse({ locale: 'en' }));
    expect(page.items[0]).toMatchObject({
      title: 'Tylko po polsku',
      textLocale: 'pl',
      isFallback: true,
    });
    const polish = await listPuzzles(puzzleListQuerySchema.parse({ locale: 'pl' }));
    expect(polish.items[0]?.isFallback).toBe(false);
  });

  it('filters, searches, sorts and paginates', async () => {
    const author = await newUser('author');
    const easy = await createPuzzle(
      author.id,
      puzzleInput({ difficulty: 'easy', tags: ['logic'] }),
    );
    const hard = await createPuzzle(
      author.id,
      puzzleInput({ difficulty: 'hard', cipherId: 'rot13', cipherOptions: {}, tags: ['story'] }),
    );
    const list = (query: Record<string, unknown>) =>
      listPuzzles(puzzleListQuerySchema.parse(query));

    expect((await list({ difficulty: 'hard' })).items.map((p) => p.id)).toEqual([hard]);
    expect((await list({ cipher: 'caesar' })).items.map((p) => p.id)).toEqual([easy]);
    expect((await list({ tag: 'logic' })).items.map((p) => p.id)).toEqual([easy]);
    expect((await list({ q: 'STORY' })).items.map((p) => p.id)).toEqual([hard]);
    expect((await list({ q: 'midnight' })).total).toBe(2);
    expect((await list({ q: 'nothing like this' })).total).toBe(0);
    expect((await list({ sort: 'hardest' })).items.map((p) => p.id)).toEqual([hard, easy]);

    const second = await list({ page: 2 });
    expect(second).toMatchObject({ total: 2, page: 2, totalPages: 1, items: [] });
  });
});

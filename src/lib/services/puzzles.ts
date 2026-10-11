import { createHash } from 'node:crypto';
import type { Locale } from '@/i18n/routing';
import { normalizeAnswer } from '@/lib/answer';
import { ApiError } from '@/lib/api';
import { CipherError, getCipher, runCipher, type Difficulty } from '@/lib/ciphers';
import { db } from '@/lib/db';
import { localizeText } from '@/lib/puzzle-text';
import { difficultyRank } from '@/lib/scoring';
import type { PuzzleDetail, PuzzlePage, PuzzleSummary } from '@/lib/types';
import type { CreatePuzzleInput, PuzzleListQuery } from '@/lib/validation/puzzle';
import type { Prisma } from '@/generated/prisma/client';
import { grantAchievements } from './achievements';

export const PAGE_SIZE = 12;

export function hashAnswer(answer: string): string {
  return createHash('sha256').update(normalizeAnswer(answer)).digest('hex');
}

const CIPHER_ISSUE: Record<string, string> = {
  invalidInput: 'cipherInvalidInput',
  unsupportedCharacter: 'cipherUnsupportedCharacter',
  invalidKey: 'cipherInvalidKey',
};

export async function createPuzzle(authorId: string, input: CreatePuzzleInput): Promise<string> {
  const cipher = getCipher(input.cipherId);
  if (!cipher) throw new ApiError('validation', { cipherId: 'invalid' });

  const options = cipher.optionsSchema.safeParse(input.cipherOptions);
  if (!options.success) throw new ApiError('validation', { cipherOptions: 'cipherInvalidKey' });

  let ciphertext: string;
  try {
    ciphertext = runCipher(cipher, 'encrypt', input.plaintext, options.data);
  } catch (error) {
    if (error instanceof CipherError) {
      throw new ApiError('validation', { plaintext: CIPHER_ISSUE[error.code] ?? 'invalid' });
    }
    throw error;
  }

  const translations = (['en', 'pl'] as const).flatMap((locale) => {
    const text = input.translations[locale];
    return text ? [{ locale, ...text, isOriginal: locale === input.originalLocale }] : [];
  });

  const puzzle = await db.puzzle.create({
    data: {
      authorId,
      cipherId: cipher.id,
      cipherOptions: options.data,
      ciphertext,
      answerHash: hashAnswer(input.plaintext),
      difficulty: input.difficulty,
      difficultyRank: difficultyRank(input.difficulty),
      maxAttempts: input.maxAttempts,
      timeLimitSeconds: input.timeLimitSeconds,
      originalLocale: input.originalLocale,
      translations: { create: translations },
      tags: {
        create: [...new Set(input.tags)].map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
    },
    select: { id: true },
  });
  await grantAchievements(authorId);
  return puzzle.id;
}

const summarySelect = (locale: Locale) =>
  ({
    id: true,
    difficulty: true,
    cipherId: true,
    solveCount: true,
    attemptCount: true,
    totalSolveSeconds: true,
    createdAt: true,
    author: { select: { username: true } },
    tags: { select: { tag: { select: { name: true } } } },
    translations: {
      where: { OR: [{ locale }, { isOriginal: true }] },
      select: { locale: true, isOriginal: true, title: true, description: true, hints: true },
    },
  }) satisfies Prisma.PuzzleSelect;

type SummaryRow = Prisma.PuzzleGetPayload<{ select: ReturnType<typeof summarySelect> }>;

export function toSummary(row: SummaryRow, locale: Locale): PuzzleSummary {
  const text = localizeText(row.translations, locale);
  return {
    id: row.id,
    title: text.title,
    description: text.description,
    difficulty: row.difficulty as Difficulty,
    cipherId: row.cipherId,
    tags: row.tags.map((entry) => entry.tag.name).sort(),
    solveCount: row.solveCount,
    attemptCount: row.attemptCount,
    averageSolveSeconds:
      row.solveCount > 0 ? Math.round(row.totalSolveSeconds / row.solveCount) : null,
    createdAt: row.createdAt.toISOString(),
    author: row.author.username,
    textLocale: text.locale,
    isFallback: text.isFallback,
  };
}

const ORDER: Record<PuzzleListQuery['sort'], Prisma.PuzzleOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  popular: [{ solveCount: 'desc' }, { createdAt: 'desc' }],
  hardest: [{ difficultyRank: 'desc' }, { solveCount: 'asc' }, { createdAt: 'desc' }],
};

export async function listPuzzles(query: PuzzleListQuery): Promise<PuzzlePage> {
  const { q, difficulty, tag, cipher, sort, locale, page } = query;
  const where: Prisma.PuzzleWhereInput = {
    ...(difficulty && { difficulty }),
    ...(cipher && { cipherId: cipher }),
    ...(tag && { tags: { some: { tag: { name: tag } } } }),
    ...(q && {
      OR: [
        { translations: { some: { title: { contains: q } } } },
        { tags: { some: { tag: { name: { contains: q.toLowerCase() } } } } },
      ],
    }),
  };

  const [total, rows] = await db.$transaction([
    db.puzzle.count({ where }),
    db.puzzle.findMany({
      where,
      orderBy: ORDER[sort],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: summarySelect(locale),
    }),
  ]);

  return {
    items: rows.map((row) => toSummary(row, locale)),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getPuzzle(id: string, locale: Locale): Promise<PuzzleDetail | null> {
  const row = await db.puzzle.findUnique({
    where: { id },
    select: {
      ...summarySelect(locale),
      ciphertext: true,
      maxAttempts: true,
      timeLimitSeconds: true,
    },
  });
  if (!row) return null;
  return {
    ...toSummary(row, locale),
    ciphertext: row.ciphertext,
    maxAttempts: row.maxAttempts,
    timeLimitSeconds: row.timeLimitSeconds,
    hintCount: localizeText(row.translations, locale).hints.length,
  };
}

/** Most used tags first, for the gallery filter. */
export async function popularTags(limit = 30): Promise<string[]> {
  const rows = await db.tag.findMany({
    orderBy: { puzzles: { _count: 'desc' } },
    take: limit,
    select: { name: true },
  });
  return rows.map((row) => row.name);
}

export async function listPuzzleIds(): Promise<{ id: string; createdAt: Date }[]> {
  return db.puzzle.findMany({
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

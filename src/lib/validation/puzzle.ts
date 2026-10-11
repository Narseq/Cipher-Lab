import { z } from 'zod';
import { MAX_HINTS } from '@/lib/scoring';

export const localeSchema = z.enum(['en', 'pl']);
export const difficultySchema = z.enum(['easy', 'medium', 'hard', 'expert']);

const translationSchema = z.object({
  title: z.string('required').trim().min(3, 'titleTooShort').max(80, 'titleTooLong'),
  description: z.string('required').trim().min(1, 'required').max(1000, 'descriptionTooLong'),
  explanation: z.string().trim().max(1000, 'explanationTooLong').default(''),
  hints: z
    .array(z.string().trim().min(1, 'required').max(300, 'hintTooLong'))
    .max(MAX_HINTS, 'tooManyHints')
    .default([]),
});

export type TranslationInput = z.infer<typeof translationSchema>;

const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{2,24}$/, 'tagInvalid');

export const createPuzzleSchema = z
  .object({
    cipherId: z.string('required').min(1, 'required'),
    cipherOptions: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
    plaintext: z.string('required').trim().min(1, 'required').max(500, 'plaintextTooLong'),
    difficulty: difficultySchema,
    maxAttempts: z.number().int().min(1, 'attemptsInvalid').max(100, 'attemptsInvalid').nullable(),
    timeLimitSeconds: z
      .number()
      .int()
      .min(30, 'timeLimitInvalid')
      .max(86_400, 'timeLimitInvalid')
      .nullable(),
    originalLocale: localeSchema,
    translations: z.object({
      en: translationSchema.optional(),
      pl: translationSchema.optional(),
    }),
    tags: z.array(tagSchema).max(5, 'tooManyTags').default([]),
  })
  .superRefine((value, ctx) => {
    const original = value.translations[value.originalLocale];
    if (!original) {
      ctx.addIssue({
        code: 'custom',
        path: ['translations', value.originalLocale],
        message: 'required',
      });
      return;
    }
    const other = value.translations[value.originalLocale === 'en' ? 'pl' : 'en'];
    if (other && other.hints.length !== original.hints.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['translations', value.originalLocale === 'en' ? 'pl' : 'en', 'hints'],
        message: 'hintCountMismatch',
      });
    }
  });

export type CreatePuzzleInput = z.infer<typeof createPuzzleSchema>;

export const submissionSchema = z.object({
  answer: z.string('required').trim().min(1, 'required').max(500, 'plaintextTooLong'),
});

export const hintSchema = z.object({
  position: z.number().int().min(1).max(MAX_HINTS),
});

export const puzzleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().max(80).optional(),
  difficulty: difficultySchema.optional(),
  tag: z.string().trim().toLowerCase().max(24).optional(),
  cipher: z.string().trim().max(24).optional(),
  sort: z.enum(['newest', 'popular', 'hardest']).default('newest'),
  locale: localeSchema.default('en'),
});

export type PuzzleListQuery = z.infer<typeof puzzleListQuerySchema>;

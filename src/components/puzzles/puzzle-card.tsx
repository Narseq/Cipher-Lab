import { Clock, Target, Trophy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Badge, Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { getCipher } from '@/lib/ciphers';
import type { PuzzleSummary } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

const DIFFICULTY_STYLE: Record<PuzzleSummary['difficulty'], string> = {
  easy: 'text-accent',
  medium: 'text-warning',
  hard: 'text-danger',
  expert: 'text-danger font-semibold',
};

export async function PuzzleCard({ puzzle }: { puzzle: PuzzleSummary }) {
  const [t, tDifficulty] = await Promise.all([
    getTranslations('puzzles.card'),
    getTranslations('difficulty'),
  ]);

  return (
    <Card className="relative flex h-full flex-col gap-3 transition-colors hover:border-accent">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-lg font-semibold leading-tight">
          <Link
            href={`/puzzle/${puzzle.id}`}
            className="after:absolute after:inset-0 hover:text-accent"
          >
            {puzzle.title}
          </Link>
        </h3>
        <span
          className={`shrink-0 font-mono text-xs uppercase ${DIFFICULTY_STYLE[puzzle.difficulty]}`}
        >
          {tDifficulty(puzzle.difficulty)}
        </span>
      </div>

      <p className="line-clamp-3 text-sm text-muted">{puzzle.description}</p>

      {puzzle.isFallback && (
        <p lang={puzzle.textLocale} className="text-xs text-warning">
          {t(`onlyIn.${puzzle.textLocale}`)}
        </p>
      )}

      <ul className="flex flex-wrap gap-1.5" aria-label={t('tags')}>
        <li>
          <Badge className="border-accent text-accent">{getCipher(puzzle.cipherId)?.name}</Badge>
        </li>
        {puzzle.tags.map((tag) => (
          <li key={tag}>
            <Badge>#{tag}</Badge>
          </li>
        ))}
      </ul>

      <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted">
        <div className="flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">{t('solvesLabel')}</dt>
          <dd>{t('solves', { count: puzzle.solveCount })}</dd>
        </div>
        <div className="flex items-center gap-1">
          <Target className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">{t('attemptsLabel')}</dt>
          <dd>{t('attempts', { count: puzzle.attemptCount })}</dd>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">{t('averageTimeLabel')}</dt>
          <dd>
            {puzzle.averageSolveSeconds === null
              ? t('noSolvesYet')
              : formatDuration(puzzle.averageSolveSeconds)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted">{t('by', { author: puzzle.author })}</p>
    </Card>
  );
}

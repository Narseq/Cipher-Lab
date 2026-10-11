import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PuzzlePlayer } from '@/components/puzzles/puzzle-player';
import { Badge } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/auth/session';
import { getCipher } from '@/lib/ciphers';
import { pageMetadata } from '@/lib/seo';
import { getPuzzle } from '@/lib/services/puzzles';
import { formatDuration } from '@/lib/utils';

type Props = { params: Promise<{ locale: Locale; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const puzzle = await getPuzzle(id, locale);
  if (!puzzle) return {};
  return pageMetadata({
    locale,
    path: `/puzzle/${id}`,
    title: puzzle.title,
    description: puzzle.description.slice(0, 160),
  });
}

export default async function PuzzlePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [puzzle, user, t, tDifficulty] = await Promise.all([
    getPuzzle(id, locale),
    getCurrentUser(),
    getTranslations('play'),
    getTranslations('difficulty'),
  ]);
  if (!puzzle) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          <Link href="/puzzles" className="hover:text-accent">
            ← {t('backToGallery')}
          </Link>
        </p>
        <h1 className="font-mono text-3xl font-semibold">{puzzle.title}</h1>
        <p className="max-w-3xl whitespace-pre-line text-muted">{puzzle.description}</p>
        {puzzle.isFallback && (
          <p lang={puzzle.textLocale} className="text-sm text-warning">
            {t(`onlyIn.${puzzle.textLocale}`)}
          </p>
        )}
        <ul className="flex flex-wrap items-center gap-2" aria-label={t('details')}>
          <li>
            <Badge>{tDifficulty(puzzle.difficulty)}</Badge>
          </li>
          <li>
            <Badge className="border-accent text-accent">{getCipher(puzzle.cipherId)?.name}</Badge>
          </li>
          {puzzle.timeLimitSeconds !== null && (
            <li>
              <Badge>{t('timeLimit', { time: formatDuration(puzzle.timeLimitSeconds) })}</Badge>
            </li>
          )}
          {puzzle.tags.map((tag) => (
            <li key={tag}>
              <Badge>#{tag}</Badge>
            </li>
          ))}
          <li className="text-xs text-muted">
            <Link href={`/profile/${puzzle.author}`} className="hover:text-accent">
              {t('by', { author: puzzle.author })}
            </Link>
          </li>
        </ul>
      </header>

      <PuzzlePlayer puzzle={puzzle} loggedIn={user !== null} />
    </div>
  );
}

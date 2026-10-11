import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Pagination } from '@/components/puzzles/pagination';
import { PuzzleCard } from '@/components/puzzles/puzzle-card';
import { PuzzleFilters } from '@/components/puzzles/puzzle-filters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { listPuzzles, popularTags } from '@/lib/services/puzzles';
import { puzzleListQuerySchema } from '@/lib/validation/puzzle';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.puzzles' });
  return pageMetadata({
    locale,
    path: '/puzzles',
    title: t('title'),
    description: t('description'),
  });
}

/** Query values from the URL: first value only, and empty form fields count as absent. */
function cleanParams(raw: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value] as const)
      .filter(([, value]) => value !== undefined && value !== ''),
  );
}

export default async function PuzzlesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('puzzles');

  const parsed = puzzleListQuerySchema.safeParse({ ...cleanParams(await searchParams), locale });
  const query = parsed.success ? parsed.data : puzzleListQuerySchema.parse({ locale });
  const [page, tags] = await Promise.all([listPuzzles(query), popularTags()]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-mono text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t('subtitle')}</p>
      </header>

      <PuzzleFilters query={query} tags={tags} />

      <p className="text-sm text-muted" aria-live="polite">
        {t('count', { count: page.total })}
      </p>

      {page.items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <h2 className="font-mono text-xl font-semibold">{t('empty.title')}</h2>
          <p className="max-w-md text-muted">{t('empty.description')}</p>
          <Button asChild>
            <Link href="/create">{t('empty.create')}</Link>
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((puzzle) => (
            <li key={puzzle.id}>
              <PuzzleCard puzzle={puzzle} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page.page}
        totalPages={page.totalPages}
        pathname="/puzzles"
        params={{
          q: query.q,
          difficulty: query.difficulty,
          cipher: query.cipher,
          tag: query.tag,
          sort: query.sort,
        }}
      />
    </div>
  );
}

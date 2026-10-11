import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { getLeaderboard } from '@/lib/services/leaderboard';
import type { LeaderboardPeriod } from '@/lib/types';
import { cn } from '@/lib/utils';

const PERIODS: readonly LeaderboardPeriod[] = ['daily', 'weekly', 'global'];

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ period?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.leaderboard' });
  return pageMetadata({
    locale,
    path: '/leaderboard',
    title: t('title'),
    description: t('description'),
  });
}

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { period: rawPeriod } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('leaderboard');

  const period = PERIODS.find((value) => value === rawPeriod) ?? 'global';
  const rows = await getLeaderboard(period);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-mono text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-muted">{t('subtitle')}</p>
      </header>

      <nav aria-label={t('periodLabel')} className="flex gap-2">
        {PERIODS.map((value) => (
          <Link
            key={value}
            href={{ pathname: '/leaderboard', query: { period: value } }}
            aria-current={value === period ? 'page' : undefined}
            className={cn(
              buttonVariants({ variant: value === period ? 'primary' : 'outline', size: 'sm' }),
            )}
          >
            {t(`periods.${value}`)}
          </Link>
        ))}
      </nav>

      <Card className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-muted">{t('empty')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t(`periods.${period}`)}</caption>
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t('columns.rank')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('columns.player')}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t('columns.solved')}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t('columns.points')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.username} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-accent">{row.rank}</td>
                  <td className="px-4 py-3">
                    <Link href={`/profile/${row.username}`} className="hover:text-accent">
                      {row.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{row.solved}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

import { Award, Flame, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PuzzleCard } from '@/components/puzzles/puzzle-card';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { ACHIEVEMENT_CODES } from '@/lib/achievements';
import { pageMetadata } from '@/lib/seo';
import { getProfile } from '@/lib/services/profiles';
import { formatDuration } from '@/lib/utils';

type Props = { params: Promise<{ locale: Locale; username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.profile' });
  return pageMetadata({
    locale,
    path: `/profile/${username}`,
    title: t('title', { username }),
    description: t('description', { username }),
  });
}

export default async function ProfilePage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const [profile, t, tBadges, format] = await Promise.all([
    getProfile(username, locale),
    getTranslations('profile'),
    getTranslations('badges'),
    getFormatter(),
  ]);
  if (!profile) notFound();

  const earned = new Map(profile.badges.map((badge) => [badge.code, badge.earnedAt]));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-mono text-3xl font-semibold">{profile.username}</h1>
        <p className="mt-1 text-sm text-muted">
          {t('joined', {
            date: format.dateTime(new Date(profile.joinedAt), { dateStyle: 'long' }),
          })}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <dt className="flex items-center gap-1 text-xs text-muted">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            {t('stats.points')}
          </dt>
          <dd className="font-mono text-3xl text-accent">{profile.totalPoints}</dd>
        </Card>
        <Card>
          <dt className="text-xs text-muted">{t('stats.solved')}</dt>
          <dd className="font-mono text-3xl">{profile.solvedCount}</dd>
        </Card>
        <Card>
          <dt className="flex items-center gap-1 text-xs text-muted">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            {t('stats.streak')}
          </dt>
          <dd className="text-lg">{t('days', { count: profile.currentStreak })}</dd>
        </Card>
        <Card>
          <dt className="text-xs text-muted">{t('stats.longestStreak')}</dt>
          <dd className="text-lg">{t('days', { count: profile.longestStreak })}</dd>
        </Card>
      </dl>

      <section aria-labelledby="badges-heading">
        <h2
          id="badges-heading"
          className="mb-3 flex items-center gap-2 font-mono text-xl font-semibold"
        >
          <Award className="h-5 w-5 text-warning" aria-hidden />
          {t('badges.title')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENT_CODES.map((code) => {
            const earnedAt = earned.get(code);
            return (
              <li key={code}>
                <Card className={earnedAt ? 'border-warning' : 'opacity-60'}>
                  <p className="font-semibold">{tBadges(`${code}.name`)}</p>
                  <p className="text-sm text-muted">{tBadges(`${code}.description`)}</p>
                  <p className="mt-2 text-xs text-muted">
                    {earnedAt
                      ? t('badges.earned', {
                          date: format.dateTime(new Date(earnedAt), { dateStyle: 'medium' }),
                        })
                      : t('badges.locked')}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="solved-heading">
        <h2 id="solved-heading" className="mb-3 font-mono text-xl font-semibold">
          {t('solved.title')}
        </h2>
        {profile.solved.length === 0 ? (
          <p className="text-muted">{t('solved.empty')}</p>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t('solved.title')}</caption>
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {t('solved.puzzle')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('solved.date')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {t('solved.time')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {t('solved.points')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {profile.solved.map((entry) => (
                  <tr key={entry.puzzleId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/puzzle/${entry.puzzleId}`} className="hover:text-accent">
                        {entry.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {format.dateTime(new Date(entry.solvedAt), { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatDuration(entry.elapsedSeconds)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent">+{entry.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section aria-labelledby="created-heading">
        <h2 id="created-heading" className="mb-3 font-mono text-xl font-semibold">
          {t('created.title')}
        </h2>
        {profile.created.length === 0 ? (
          <p className="text-muted">{t('created.empty')}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.created.map((puzzle) => (
              <li key={puzzle.id}>
                <PuzzleCard puzzle={puzzle} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

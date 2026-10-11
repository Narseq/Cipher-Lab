import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PuzzleCreator } from '@/components/create/puzzle-creator';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/auth/session';
import { pageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.create' });
  return pageMetadata({
    locale,
    path: '/create',
    title: t('title'),
    description: t('description'),
  });
}

export default async function CreatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await getCurrentUser())) {
    redirect({ href: { pathname: '/login', query: { next: '/create' } }, locale });
  }
  const t = await getTranslations('create');

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-mono text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-muted">{t('subtitle')}</p>
      </header>
      <PuzzleCreator />
    </div>
  );
}

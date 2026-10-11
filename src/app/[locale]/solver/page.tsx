import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SolverWorkbench } from '@/components/solver/solver-workbench';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.solver' });
  return pageMetadata({
    locale,
    path: '/solver',
    title: t('title'),
    description: t('description'),
  });
}

export default async function SolverPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('solver');

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-mono text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t('subtitle')}</p>
      </header>
      <SolverWorkbench />
    </div>
  );
}

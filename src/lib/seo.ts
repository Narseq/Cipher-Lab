import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';

export const SITE_NAME = 'Cipher Lab';

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', pl: 'pl_PL' };

/** Canonical URL and hreflang links of a path (without locale prefix, e.g. "/solver" or ""). */
export function alternatesFor(path: string, locale: Locale): Metadata['alternates'] {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((code) => [code, `${siteUrl()}/${code}${path}`]),
  );
  languages['x-default'] = `${siteUrl()}/${routing.defaultLocale}${path}`;
  return { canonical: `${siteUrl()}/${locale}${path}`, languages };
}

interface PageMetadata {
  locale: Locale;
  path: string;
  title: string;
  description: string;
}

export function pageMetadata({ locale, path, title, description }: PageMetadata): Metadata {
  return {
    title,
    description,
    alternates: alternatesFor(path, locale),
    openGraph: {
      title,
      description,
      url: `${siteUrl()}/${locale}${path}`,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((code) => code !== locale).map((c) => OG_LOCALE[c]),
      type: 'website',
    },
  };
}

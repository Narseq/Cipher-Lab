import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { Toaster } from 'sonner';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ThemeScript } from '@/components/layout/theme-script';
import { routing } from '@/i18n/routing';
import { pageMetadata, siteUrl, SITE_NAME } from '@/lib/seo';
import '../globals.css';

// Toasts follow the app palette, so they match both the dark and the light theme.
const TOAST_STYLE = {
  '--normal-bg': 'var(--surface)',
  '--normal-text': 'var(--foreground)',
  '--normal-border': 'var(--border)',
} as CSSProperties;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta.home' });
  return {
    ...pageMetadata({ locale, path: '', title: t('title'), description: t('description') }),
    metadataBase: new URL(siteUrl()),
    title: { default: t('title'), template: `%s · ${SITE_NAME}` },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-foreground"
          >
            {t('skipToContent')}
          </a>
          <SiteHeader />
          <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
          <SiteFooter />
          <Toaster position="bottom-right" style={TOAST_STYLE} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

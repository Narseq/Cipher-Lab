'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { Select } from '@/components/ui/input';

const STORAGE_KEY = 'locale';

function remember(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Without storage the NEXT_LOCALE cookie still keeps the choice.
  }
}

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  // The URL always wins; record it so the preference survives a visit via a shared link.
  useEffect(() => remember(locale), [locale]);

  function change(next: string) {
    const target = routing.locales.find((candidate) => candidate === next);
    if (!target) return;
    remember(target);
    router.replace(pathname, { locale: target });
  }

  return (
    <Select
      value={locale}
      onChange={(event) => change(event.target.value)}
      aria-label={t('label')}
      className="w-auto"
    >
      {routing.locales.map((code) => (
        <option key={code} value={code} lang={code}>
          {t(`names.${code}`)}
        </option>
      ))}
    </Select>
  );
}

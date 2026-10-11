import { z } from 'zod';
import { isLocale, routing, type Locale } from '@/i18n/routing';

interface TranslationRow {
  locale: string;
  isOriginal: boolean;
  title: string;
  description: string;
  explanation?: string;
  hints?: unknown;
}

export interface LocalizedText {
  locale: Locale;
  title: string;
  description: string;
  explanation: string;
  hints: string[];
  isFallback: boolean;
}

const hintsSchema = z.array(z.string());

/** Text in the requested language, or the original version when that one is missing. */
export function localizeText(translations: TranslationRow[], locale: Locale): LocalizedText {
  const exact = translations.find((row) => row.locale === locale);
  const row = exact ?? translations.find((candidate) => candidate.isOriginal) ?? translations[0];
  if (!row) throw new Error('A puzzle must have at least one translation');
  const rowLocale = isLocale(row.locale) ? row.locale : routing.defaultLocale;
  return {
    locale: rowLocale,
    title: row.title,
    description: row.description,
    explanation: row.explanation ?? '',
    hints: hintsSchema.catch([]).parse(row.hints ?? []),
    isFallback: rowLocale !== locale,
  };
}

import { Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { ciphers } from '@/lib/ciphers';
import { DIFFICULTIES } from '@/lib/scoring';
import type { PuzzleListQuery } from '@/lib/validation/puzzle';

const SORTS = ['newest', 'popular', 'hardest'] as const;

interface PuzzleFiltersProps {
  query: PuzzleListQuery;
  tags: string[];
}

/** A plain GET form: filters live in the URL, so results are shareable and need no JavaScript. */
export async function PuzzleFilters({ query, tags }: PuzzleFiltersProps) {
  const [t, tDifficulty] = await Promise.all([
    getTranslations('puzzles.filters'),
    getTranslations('difficulty'),
  ]);

  return (
    <form
      method="get"
      role="search"
      aria-label={t('label')}
      className="grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="sm:col-span-2">
        <Field id="filter-q" label={t('search')}>
          <Input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={query.q ?? ''}
            placeholder={t('searchPlaceholder')}
          />
        </Field>
      </div>
      <Field id="filter-difficulty" label={t('difficulty')}>
        <Select id="filter-difficulty" name="difficulty" defaultValue={query.difficulty ?? ''}>
          <option value="">{t('any')}</option>
          {DIFFICULTIES.map((value) => (
            <option key={value} value={value}>
              {tDifficulty(value)}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="filter-cipher" label={t('cipher')}>
        <Select id="filter-cipher" name="cipher" defaultValue={query.cipher ?? ''}>
          <option value="">{t('any')}</option>
          {ciphers.map((cipher) => (
            <option key={cipher.id} value={cipher.id}>
              {cipher.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="filter-tag" label={t('tag')}>
        <Select id="filter-tag" name="tag" defaultValue={query.tag ?? ''}>
          <option value="">{t('any')}</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="filter-sort" label={t('sort')}>
        <Select id="filter-sort" name="sort" defaultValue={query.sort}>
          {SORTS.map((value) => (
            <option key={value} value={value}>
              {t(`sorts.${value}`)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="submit">
          <Search className="h-4 w-4" aria-hidden />
          {t('apply')}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/puzzles">{t('reset')}</Link>
        </Button>
      </div>
    </form>
  );
}

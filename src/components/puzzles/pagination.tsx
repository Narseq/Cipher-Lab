import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Path (without locale) and the query parameters to keep when changing page. */
  pathname: string;
  params: Record<string, string | undefined>;
}

export async function Pagination({ page, totalPages, pathname, params }: PaginationProps) {
  if (totalPages <= 1) return null;
  const t = await getTranslations('common');

  const hrefFor = (target: number) => ({
    pathname,
    query: Object.fromEntries(
      Object.entries({ ...params, page: String(target) }).filter(([, value]) => value),
    ) as Record<string, string>,
  });
  const link = cn(buttonVariants({ variant: 'outline', size: 'sm' }));
  const disabled = cn(link, 'pointer-events-none opacity-50');

  return (
    <nav aria-label={t('pagination')} className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={link} rel="prev">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t('previous')}
        </Link>
      ) : (
        <span className={disabled} aria-disabled>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t('previous')}
        </span>
      )}
      <span className="font-mono text-sm text-muted" aria-current="page">
        {t('pageOf', { page, total: totalPages })}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={link} rel="next">
          {t('next')}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className={disabled} aria-disabled>
          {t('next')}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}

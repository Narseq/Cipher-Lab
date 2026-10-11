'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

// The error itself is never shown: technical details stay in the server log.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('error');

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-mono text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted">{t('description')}</p>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}

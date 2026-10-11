import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <p className="font-mono text-6xl text-accent" aria-hidden>
        404
      </p>
      <h1 className="font-mono text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted">{t('description')}</p>
      <Button asChild>
        <Link href="/">{t('home')}</Link>
      </Button>
    </div>
  );
}

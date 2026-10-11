import { getTranslations } from 'next-intl/server';

export async function SiteFooter() {
  const t = await getTranslations('footer');

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-mono text-foreground">Cipher Lab</span> — {t('tagline')}
        </p>
        <p>{t('license')}</p>
      </div>
    </footer>
  );
}

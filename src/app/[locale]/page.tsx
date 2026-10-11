import { BarChart3, PenTool, Puzzle, Trophy } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HeroTerminal } from '@/components/home/hero-terminal';
import { Button } from '@/components/ui/button';
import { Badge, Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { ciphers } from '@/lib/ciphers';

const FEATURES = [
  { key: 'solver', icon: BarChart3 },
  { key: 'create', icon: PenTool },
  { key: 'solve', icon: Puzzle },
  { key: 'rank', icon: Trophy },
] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tRoot, tDifficulty] = await Promise.all([
    getTranslations('home'),
    getTranslations(),
    getTranslations('difficulty'),
  ]);

  return (
    <div className="flex flex-col gap-16">
      <section className="relative grid items-center gap-8 py-8 lg:grid-cols-2">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />
        <div className="flex flex-col gap-5">
          <h1 className="font-mono text-4xl font-bold leading-tight sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="max-w-xl text-lg text-muted">{t('hero.subtitle')}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/solver">{t('hero.solver')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/puzzles">{t('hero.puzzles')}</Link>
            </Button>
          </div>
        </div>
        <HeroTerminal />
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="mb-6 font-mono text-2xl font-semibold">
          {t('features.title')}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ key, icon: Icon }) => (
            <li key={key}>
              <Card className="h-full">
                <Icon className="mb-3 h-6 w-6 text-accent" aria-hidden />
                <h3 className="font-semibold">{t(`features.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-muted">{t(`features.${key}.description`)}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ciphers-heading">
        <h2 id="ciphers-heading" className="mb-6 font-mono text-2xl font-semibold">
          {t('ciphers.title')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ciphers.map((cipher) => (
            <li key={cipher.id}>
              <Card className="h-full">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-mono font-semibold">{cipher.name}</h3>
                  <Badge>{tDifficulty(cipher.difficulty)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {/* `description` is a message key such as "ciphers.caesar.description" */}
                  {tRoot(cipher.description as never)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

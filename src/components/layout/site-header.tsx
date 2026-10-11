import { KeyRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { LanguageSwitcher } from './language-switcher';
import { LogoutButton } from './logout-button';
import { MainNav } from './main-nav';
import { ThemeToggle } from './theme-toggle';

export async function SiteHeader() {
  const [t, user] = await Promise.all([getTranslations('nav'), getCurrentUser()]);

  return (
    <header className="relative z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-mono text-lg font-semibold">
          <KeyRound className="h-5 w-5 text-accent" aria-hidden />
          Cipher Lab
        </Link>
        <MainNav>
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/profile/${user.username}`}>{user.username}</Link>
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t('register')}</Link>
              </Button>
            </>
          )}
        </MainNav>
      </div>
    </header>
  );
}

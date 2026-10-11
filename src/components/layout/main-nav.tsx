'use client';

import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/solver', key: 'solver' },
  { href: '/puzzles', key: 'puzzles' },
  { href: '/create', key: 'create' },
  { href: '/leaderboard', key: 'leaderboard' },
] as const;

/** Primary navigation; collapses into a toggled panel on small screens. `children` is the toolbar. */
export function MainNav({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded p-2 text-foreground md:hidden"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? t('closeMenu') : t('openMenu')}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>
      <div
        id="site-menu"
        className={cn(
          'absolute inset-x-0 top-full flex-col gap-4 border-b border-border bg-surface p-4 md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0',
          open ? 'flex' : 'hidden',
        )}
      >
        <nav aria-label={t('label')}>
          <ul className="flex flex-col gap-1 md:flex-row md:gap-1">
            {LINKS.map(({ href, key }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-raised',
                      active ? 'text-accent' : 'text-foreground',
                    )}
                  >
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </>
  );
}

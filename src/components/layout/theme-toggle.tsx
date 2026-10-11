'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/** Reads and flips the class on <html>, so the icon is pure CSS and never mismatches on hydration. */
export function ThemeToggle() {
  const t = useTranslations('theme');

  function toggle() {
    const light = document.documentElement.classList.toggle('light');
    try {
      localStorage.setItem('theme', light ? 'light' : 'dark');
    } catch {
      // The choice still applies for this visit.
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={t('toggle')}>
      <Sun className="h-4 w-4 light:hidden" aria-hidden />
      <Moon className="hidden h-4 w-4 light:block" aria-hidden />
    </Button>
  );
}

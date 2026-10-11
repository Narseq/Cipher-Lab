'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { apiFetch } from '@/lib/api-client';

export function LogoutButton() {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const router = useRouter();

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    toast.success(tAuth('loggedOut'));
    router.push('/');
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={logout}>
      <LogOut className="h-4 w-4" aria-hidden />
      {t('logout')}
    </Button>
  );
}

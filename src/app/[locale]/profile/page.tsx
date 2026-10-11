import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/auth/session';

type Props = { params: Promise<{ locale: Locale }> };

/** `/profile` shows the signed-in user's own profile. */
export default async function OwnProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect({ href: { pathname: '/login', query: { next: '/profile' } }, locale });
  else redirect({ href: `/profile/${user.username}`, locale });
}

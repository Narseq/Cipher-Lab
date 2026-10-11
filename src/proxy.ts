import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Detects the browser language on the first visit (pl -> /pl, anything else -> /en) and
// remembers the choice in the NEXT_LOCALE cookie.
export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};

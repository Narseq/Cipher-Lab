import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/seo';
import { listPuzzleIds } from '@/lib/services/puzzles';

const STATIC_PATHS = ['', '/solver', '/puzzles', '/create', '/leaderboard', '/login', '/register'];

// Puzzles come from the database, so the sitemap is built per request instead of at build time.
export const dynamic = 'force-dynamic';

/** One entry per language version; each one lists all versions as hreflang alternates. */
function entries(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${siteUrl()}/${locale}${path}`]),
  );
  return routing.locales.map((locale) => ({
    url: `${siteUrl()}/${locale}${path}`,
    lastModified,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const puzzles = await listPuzzleIds();
  return [
    ...STATIC_PATHS.flatMap((path) => entries(path)),
    ...puzzles.flatMap((puzzle) => entries(`/puzzle/${puzzle.id}`, puzzle.createdAt)),
  ];
}

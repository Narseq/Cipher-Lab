import { ApiError, handle, ok } from '@/lib/api';
import { getPuzzle } from '@/lib/services/puzzles';
import { localeSchema } from '@/lib/validation/puzzle';

export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await context.params;
    const locale = localeSchema.catch('en').parse(new URL(request.url).searchParams.get('locale'));
    const puzzle = await getPuzzle(id, locale);
    if (!puzzle) throw new ApiError('notFound');
    return ok(puzzle);
  });
}

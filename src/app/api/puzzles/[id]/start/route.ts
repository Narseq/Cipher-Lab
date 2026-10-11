import { handle, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { startPuzzle } from '@/lib/services/play';
import { localeSchema } from '@/lib/validation/puzzle';

export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const locale = localeSchema.catch('en').parse(new URL(request.url).searchParams.get('locale'));
    return ok(await startPuzzle(user.id, id, locale));
  });
}

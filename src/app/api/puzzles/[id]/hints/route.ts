import { handle, ok, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { revealHint } from '@/lib/services/play';
import { hintSchema, localeSchema } from '@/lib/validation/puzzle';

export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const { position } = hintSchema.parse(await readJson(request));
    const locale = localeSchema.catch('en').parse(new URL(request.url).searchParams.get('locale'));
    return ok(await revealHint(user.id, id, position, locale));
  });
}

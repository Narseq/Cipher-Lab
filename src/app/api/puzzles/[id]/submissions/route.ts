import { handle, ok, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { submitAnswer } from '@/lib/services/play';
import { localeSchema, submissionSchema } from '@/lib/validation/puzzle';

export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const { answer } = submissionSchema.parse(await readJson(request));
    const locale = localeSchema.catch('en').parse(new URL(request.url).searchParams.get('locale'));
    return ok(await submitAnswer(user.id, id, answer, locale));
  });
}

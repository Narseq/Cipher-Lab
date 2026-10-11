import { ApiError, handle, ok } from '@/lib/api';
import { getProfile } from '@/lib/services/profiles';
import { localeSchema } from '@/lib/validation/puzzle';

export function GET(request: Request, context: { params: Promise<{ username: string }> }) {
  return handle(async () => {
    const { username } = await context.params;
    const locale = localeSchema.catch('en').parse(new URL(request.url).searchParams.get('locale'));
    const profile = await getProfile(username, locale);
    if (!profile) throw new ApiError('notFound');
    return ok(profile);
  });
}

import { handle, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';

export function GET() {
  return handle(async () => {
    const user = await requireUser();
    return ok({ username: user.username });
  });
}

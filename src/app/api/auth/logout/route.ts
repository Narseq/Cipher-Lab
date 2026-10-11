import { handle, ok } from '@/lib/api';
import { destroySession } from '@/lib/auth/session';

export function POST() {
  return handle(async () => {
    await destroySession();
    return ok({});
  });
}

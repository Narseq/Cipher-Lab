import { handle, ok, readJson } from '@/lib/api';
import { limitByIp } from '@/lib/auth/guard';
import { createSession } from '@/lib/auth/session';
import { verifyLogin } from '@/lib/services/users';
import { loginSchema } from '@/lib/validation/auth';

export function POST(request: Request) {
  return handle(async () => {
    limitByIp(request, 'login', 10, 60 * 1000);
    const input = loginSchema.parse(await readJson(request));
    const user = await verifyLogin(input);
    await createSession(user.id);
    return ok({ username: user.username });
  });
}

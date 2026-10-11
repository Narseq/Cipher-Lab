import { handle, ok, readJson } from '@/lib/api';
import { limitByIp } from '@/lib/auth/guard';
import { createSession } from '@/lib/auth/session';
import { registerUser } from '@/lib/services/users';
import { registerSchema } from '@/lib/validation/auth';

export function POST(request: Request) {
  return handle(async () => {
    limitByIp(request, 'register', 10, 60 * 60 * 1000);
    const input = registerSchema.parse(await readJson(request));
    const user = await registerUser(input);
    await createSession(user.id);
    return ok({ username: user.username }, 201);
  });
}

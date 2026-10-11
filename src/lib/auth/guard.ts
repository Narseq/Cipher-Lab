import { ApiError } from '@/lib/api';
import { allow } from '@/lib/rate-limit';
import { getCurrentUser, type SessionUser } from './session';

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('unauthorized');
  return user;
}

/** Throttles an endpoint per client address. */
export function limitByIp(request: Request, scope: string, limit: number, windowMs: number) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!allow(`${scope}:${forwarded ?? 'local'}`, limit, windowMs))
    throw new ApiError('rateLimited');
}

import { z } from 'zod';
import { handle, ok } from '@/lib/api';
import { getLeaderboard } from '@/lib/services/leaderboard';

const periodSchema = z.enum(['daily', 'weekly', 'global']).catch('global');

export function GET(request: Request) {
  return handle(async () => {
    const period = periodSchema.parse(new URL(request.url).searchParams.get('period'));
    return ok(await getLeaderboard(period));
  });
}

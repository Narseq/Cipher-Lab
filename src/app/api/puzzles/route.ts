import { handle, ok, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { createPuzzle, listPuzzles } from '@/lib/services/puzzles';
import { createPuzzleSchema, puzzleListQuerySchema } from '@/lib/validation/puzzle';

export function GET(request: Request) {
  return handle(async () => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    return ok(await listPuzzles(puzzleListQuerySchema.parse(params)));
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = createPuzzleSchema.parse(await readJson(request));
    return ok({ id: await createPuzzle(user.id, input) }, 201);
  });
}

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { fieldIssues, type ApiErrorCode, type ApiResponse, type FieldIssues } from './api-types';

export type { ApiErrorCode, ApiResponse, FieldIssues } from './api-types';

const STATUS: Record<ApiErrorCode, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  rateLimited: 429,
  emailTaken: 409,
  usernameTaken: 409,
  invalidCredentials: 401,
  attemptsExhausted: 403,
  timeUp: 403,
  alreadySolved: 409,
  hintOrder: 409,
  cipherFailed: 400,
  internal: 500,
};

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly issues?: FieldIssues,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: ApiErrorCode, issues?: FieldIssues): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ ok: false, error: { code, issues } }, { status: STATUS[code] });
}

/** Runs a route handler body and turns every failure into the common error format. */
export async function handle<T>(run: () => Promise<NextResponse<ApiResponse<T>>>) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError) return fail(error.code, error.issues);
    if (error instanceof ZodError) return fail('validation', fieldIssues(error));
    console.error(error);
    return fail('internal');
  }
}

/** Parses a JSON request body; a missing or malformed body is a validation error. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError('validation');
  }
}

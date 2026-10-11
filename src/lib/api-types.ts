import type { ZodError } from 'zod';

/** Codes the UI translates under `errors.api.<code>`. */
export type ApiErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'rateLimited'
  | 'emailTaken'
  | 'usernameTaken'
  | 'invalidCredentials'
  | 'attemptsExhausted'
  | 'timeUp'
  | 'alreadySolved'
  | 'hintOrder'
  | 'cipherFailed'
  | 'internal';

/** Field path -> translation key under `validation.*`. */
export type FieldIssues = Record<string, string>;

export type ApiResponse<T> =
  { ok: true; data: T } | { ok: false; error: { code: ApiErrorCode; issues?: FieldIssues } };

const MESSAGE_KEY = /^[a-z][A-Za-z0-9]*$/;

/** Schemas use translation keys as messages; anything else (Zod's defaults) becomes `invalid`. */
export function fieldIssues(error: ZodError): FieldIssues {
  const issues: FieldIssues = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!(path in issues))
      issues[path] = MESSAGE_KEY.test(issue.message) ? issue.message : 'invalid';
  }
  return issues;
}

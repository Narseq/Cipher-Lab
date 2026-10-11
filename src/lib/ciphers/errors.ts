export type CipherErrorCode = 'invalidInput' | 'unsupportedCharacter' | 'invalidKey';

/** Error with a code the UI maps to `errors.cipher.<code>`; never carries technical details. */
export class CipherError extends Error {
  constructor(
    readonly code: CipherErrorCode,
    readonly values: Record<string, string> = {},
  ) {
    super(code);
    this.name = 'CipherError';
  }
}

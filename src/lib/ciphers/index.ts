import a1z26 from './a1z26';
import atbash from './atbash';
import base32 from './base32';
import base64 from './base64';
import binary from './binary';
import caesar from './caesar';
import hex from './hex';
import morse from './morse';
import rot13 from './rot13';
import vigenere from './vigenere';
import xor from './xor';
import { CipherError } from './errors';
import type { Cipher, CipherOptions } from './types';

export { CipherError } from './errors';
export type { Cipher, CipherCandidate, CipherOptions, Difficulty, OptionField } from './types';

/** Every cipher available in the app. To add one, create a file in this folder and list it here. */
export const ciphers: readonly Cipher[] = [
  caesar,
  rot13,
  atbash,
  base64,
  base32,
  hex,
  binary,
  morse,
  a1z26,
  vigenere,
  xor,
];

export function getCipher(id: string): Cipher | undefined {
  return ciphers.find((cipher) => cipher.id === id);
}

export type CipherOperation = 'encrypt' | 'decrypt';

/** Validates `rawOptions` against the cipher's schema, then runs the operation. */
export function runCipher(
  cipher: Cipher,
  operation: CipherOperation,
  text: string,
  rawOptions: unknown,
): string {
  const parsed = cipher.optionsSchema.safeParse(rawOptions ?? {});
  if (!parsed.success) throw new CipherError('invalidKey');
  return cipher[operation](text, parsed.data as CipherOptions);
}

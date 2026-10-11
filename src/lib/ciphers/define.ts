import { z } from 'zod';
import type { Cipher, CipherOptions } from './types';

/** Schema shared by ciphers that take no options. */
export const noOptionsSchema = z.strictObject({});

/**
 * Registers a cipher's typed options behind the common interface. This is the single place where
 * option types are erased: every cipher validates its options with its own `optionsSchema`
 * before `encrypt` / `decrypt` run (see `runCipher` in index.ts).
 */
export function defineCipher<O extends CipherOptions>(cipher: Cipher<O>): Cipher {
  return cipher as unknown as Cipher;
}

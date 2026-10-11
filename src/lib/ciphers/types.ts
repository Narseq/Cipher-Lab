import type { z } from 'zod';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type CipherOptions = Record<string, string | number>;

export type OptionField =
  | { name: string; type: 'number'; default: number; min: number; max: number }
  | { name: string; type: 'text'; default: string; maxLength: number };

/** A possible decryption of an unknown text, with the options that produced it. */
export interface CipherCandidate<O extends CipherOptions> {
  options: O;
  plaintext: string;
}

export interface Cipher<O extends CipherOptions = CipherOptions> {
  /** Stable identifier, also the key under `ciphers.<id>` in the translation files. */
  readonly id: string;
  /** Proper name, never translated. */
  readonly name: string;
  /** Translation key of the description, e.g. `ciphers.caesar.description`. */
  readonly description: string;
  readonly difficulty: Difficulty;
  /** Option fields the UI renders; empty for keyless ciphers. */
  readonly options: readonly OptionField[];
  readonly optionsSchema: z.ZodType<O>;
  encrypt(text: string, options: O): string;
  decrypt(text: string, options: O): string;
  /** How likely (0..1) it is that `text` is encoded in this cipher's output format. */
  detect(text: string): number;
  /**
   * Decryptions worth trying when the options are unknown. Keyless ciphers return a single
   * candidate, keyed ciphers search their key space. Throws a CipherError when the text is not
   * valid input for the cipher.
   */
  candidates(text: string): CipherCandidate<O>[];
}

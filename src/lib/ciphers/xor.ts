import { z } from 'zod';
import { defineCipher } from './define';
import { CipherError } from './errors';
import { bytesToHex, hexToBytes } from './hex';
import { fromBytes, toBytes } from './utils';

const optionsSchema = z.object({ key: z.string().min(1).max(32) });

const PRINTABLE_ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));

function xor(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = toBytes(key);
  if (keyBytes.length === 0) throw new CipherError('invalidKey');
  return data.map((byte, index) => byte ^ (keyBytes[index % keyBytes.length] ?? 0));
}

function decrypt(text: string, key: string): string {
  return fromBytes(xor(hexToBytes(text), key));
}

export default defineCipher({
  id: 'xor',
  name: 'XOR',
  description: 'ciphers.xor.description',
  difficulty: 'hard',
  options: [{ name: 'key', type: 'text', default: 'K', maxLength: 32 }],
  optionsSchema,
  encrypt: (text, { key }) => bytesToHex(xor(toBytes(text), key)),
  decrypt: (text, { key }) => decrypt(text, key),
  detect: (text) => {
    try {
      hexToBytes(text);
    } catch {
      return 0;
    }
    return 0.5;
  },
  // Only single-character keys are searched; longer keys need to be supplied by the player.
  candidates: (text) => {
    hexToBytes(text);
    return PRINTABLE_ASCII.flatMap((key) => {
      try {
        return [{ options: { key }, plaintext: decrypt(text, key) }];
      } catch {
        return [];
      }
    });
  },
});

import { defineCipher, noOptionsSchema } from './define';
import { CipherError } from './errors';
import { fromBytes, toBytes } from './utils';

export function hexToBytes(text: string): Uint8Array {
  const compact = text.replace(/0x|[\s,:-]/gi, '');
  if (compact.length === 0 || compact.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(compact)) {
    throw new CipherError('invalidInput');
  }
  return Uint8Array.from(compact.match(/../g) ?? [], (pair) => parseInt(pair, 16));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(' ');
}

export default defineCipher({
  id: 'hex',
  name: 'Hex',
  description: 'ciphers.hex.description',
  difficulty: 'easy',
  options: [],
  optionsSchema: noOptionsSchema,
  encrypt: (text) => bytesToHex(toBytes(text)),
  decrypt: (text) => fromBytes(hexToBytes(text)),
  detect: (text) => {
    try {
      fromBytes(hexToBytes(text));
    } catch {
      return 0;
    }
    return 0.9;
  },
  candidates: (text) => [{ options: {}, plaintext: fromBytes(hexToBytes(text)) }],
});

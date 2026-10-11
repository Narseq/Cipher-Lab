import { defineCipher, noOptionsSchema } from './define';
import { CipherError } from './errors';
import { fromBytes, stripWhitespace, toBytes } from './utils';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encode(text: string): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of toBytes(text)) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output.padEnd(Math.ceil(output.length / 8) * 8, '=');
}

function decode(text: string): string {
  const compact = stripWhitespace(text).toUpperCase().replace(/=+$/, '');
  if (compact.length === 0 || ![...compact].every((char) => ALPHABET.includes(char))) {
    throw new CipherError('invalidInput');
  }
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of compact) {
    value = (value << 5) | ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
      value &= (1 << bits) - 1;
    }
  }
  return fromBytes(Uint8Array.from(bytes));
}

export default defineCipher({
  id: 'base32',
  name: 'Base32',
  description: 'ciphers.base32.description',
  difficulty: 'medium',
  options: [],
  optionsSchema: noOptionsSchema,
  encrypt: encode,
  decrypt: decode,
  detect: (text) => {
    const compact = stripWhitespace(text);
    if (compact.length < 8 || !/^[A-Z2-7]+=*$/i.test(compact)) return 0;
    try {
      decode(compact);
    } catch {
      return 0;
    }
    return compact.endsWith('=') ? 0.9 : 0.6;
  },
  candidates: (text) => [{ options: {}, plaintext: decode(text) }],
});

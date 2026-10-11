import { defineCipher, noOptionsSchema } from './define';
import { CipherError } from './errors';
import { fromBytes, stripWhitespace, toBytes } from './utils';

function decode(text: string): string {
  const compact = stripWhitespace(text);
  if (compact.length === 0 || compact.length % 8 !== 0 || !/^[01]+$/.test(compact)) {
    throw new CipherError('invalidInput');
  }
  return fromBytes(Uint8Array.from(compact.match(/.{8}/g) ?? [], (byte) => parseInt(byte, 2)));
}

export default defineCipher({
  id: 'binary',
  name: 'Binary',
  description: 'ciphers.binary.description',
  difficulty: 'easy',
  options: [],
  optionsSchema: noOptionsSchema,
  encrypt: (text) =>
    Array.from(toBytes(text), (byte) => byte.toString(2).padStart(8, '0')).join(' '),
  decrypt: decode,
  detect: (text) => {
    try {
      decode(text);
    } catch {
      return 0;
    }
    return 0.95;
  },
  candidates: (text) => [{ options: {}, plaintext: decode(text) }],
});

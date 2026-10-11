import { defineCipher, noOptionsSchema } from './define';
import { CipherError } from './errors';
import { fromBytes, stripWhitespace, toBytes } from './utils';

const PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

function encode(text: string): string {
  return btoa(String.fromCharCode(...toBytes(text)));
}

function decode(text: string): string {
  const compact = stripWhitespace(text);
  if (!PATTERN.test(compact) || compact.replace(/=+$/, '').length % 4 === 1) {
    throw new CipherError('invalidInput');
  }
  const padded = compact.padEnd(Math.ceil(compact.length / 4) * 4, '=');
  return fromBytes(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)));
}

export default defineCipher({
  id: 'base64',
  name: 'Base64',
  description: 'ciphers.base64.description',
  difficulty: 'easy',
  options: [],
  optionsSchema: noOptionsSchema,
  encrypt: encode,
  decrypt: decode,
  detect: (text) => {
    const compact = stripWhitespace(text);
    if (compact.length < 4) return 0;
    try {
      decode(compact);
    } catch {
      return 0;
    }
    return compact.endsWith('=') || compact.length >= 8 ? 0.9 : 0.5;
  },
  candidates: (text) => [{ options: {}, plaintext: decode(text) }],
});

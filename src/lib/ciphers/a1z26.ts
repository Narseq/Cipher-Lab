import { defineCipher, noOptionsSchema } from './define';
import { CipherError } from './errors';

function encode(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((char) => {
          if (!/^[a-z]$/i.test(char)) throw new CipherError('unsupportedCharacter', { char });
          return String(char.toUpperCase().charCodeAt(0) - 64);
        })
        .join('-'),
    )
    .join(' ');
}

function decode(text: string): string {
  if (!/^[\d\s,/|-]+$/.test(text) || !/\d/.test(text)) throw new CipherError('invalidInput');
  const dashed = /[-,]/.test(text);
  const wordSeparator = dashed ? /\s*[/|]\s*|\s+/ : /\s*[/|]\s*/;
  const letterSeparator = dashed ? /[-,]+/ : /\s+/;
  return text
    .trim()
    .split(wordSeparator)
    .map((word) =>
      word
        .trim()
        .split(letterSeparator)
        .filter(Boolean)
        .map((token) => {
          const value = Number(token);
          if (!Number.isInteger(value) || value < 1 || value > 26) {
            throw new CipherError('invalidInput');
          }
          return String.fromCharCode(64 + value);
        })
        .join(''),
    )
    .join(' ');
}

export default defineCipher({
  id: 'a1z26',
  name: 'A1Z26',
  description: 'ciphers.a1z26.description',
  difficulty: 'easy',
  options: [],
  optionsSchema: noOptionsSchema,
  encrypt: encode,
  decrypt: decode,
  detect: (text) => {
    try {
      decode(text);
    } catch {
      return 0;
    }
    return 0.85;
  },
  candidates: (text) => [{ options: {}, plaintext: decode(text) }],
});

import { defineCipher, noOptionsSchema } from './define';
import { CipherError } from './errors';

// prettier-ignore
const TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
  J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '@': '.--.-.',
};

const REVERSE = new Map(Object.entries(TABLE).map(([char, code]) => [code, char]));
const WORD_SEPARATOR = /\s*\|\s*|\s{3,}/;

function encode(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((char) => {
          const code = TABLE[char];
          if (!code) throw new CipherError('unsupportedCharacter', { char });
          return code;
        })
        .join(' '),
    )
    .join(' | ');
}

function decode(text: string): string {
  if (!/^[.\-|\s]+$/.test(text) || !/[.-]/.test(text)) throw new CipherError('invalidInput');
  return text
    .trim()
    .split(WORD_SEPARATOR)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .map((code) => {
          const char = REVERSE.get(code);
          if (!char) throw new CipherError('invalidInput');
          return char;
        })
        .join(''),
    )
    .join(' ');
}

export default defineCipher({
  id: 'morse',
  name: 'Morse',
  description: 'ciphers.morse.description',
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
    return 0.95;
  },
  candidates: (text) => [{ options: {}, plaintext: decode(text) }],
});

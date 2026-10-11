import { defineCipher, noOptionsSchema } from './define';
import { lettersRatio } from './utils';

const atbash = (text: string) =>
  text.replace(/[a-z]/gi, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(base + 25 - (char.charCodeAt(0) - base));
  });

export default defineCipher({
  id: 'atbash',
  name: 'Atbash',
  description: 'ciphers.atbash.description',
  difficulty: 'easy',
  options: [],
  optionsSchema: noOptionsSchema,
  encrypt: atbash,
  decrypt: atbash,
  detect: (text) => lettersRatio(text) * 0.5,
  candidates: (text) => [{ options: {}, plaintext: atbash(text) }],
});

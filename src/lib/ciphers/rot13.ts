import { defineCipher, noOptionsSchema } from './define';
import { lettersRatio, shiftLetters } from './utils';

const rot13 = (text: string) => shiftLetters(text, 13);

export default defineCipher({
  id: 'rot13',
  name: 'ROT13',
  description: 'ciphers.rot13.description',
  difficulty: 'easy',
  options: [],
  optionsSchema: noOptionsSchema,
  encrypt: rot13,
  decrypt: rot13,
  detect: (text) => lettersRatio(text) * 0.5,
  candidates: (text) => [{ options: {}, plaintext: rot13(text) }],
});

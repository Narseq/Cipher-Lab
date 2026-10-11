import { z } from 'zod';
import { defineCipher } from './define';
import { lettersRatio, shiftLetters } from './utils';

const optionsSchema = z.object({ shift: z.number().int().min(1).max(25) });

export default defineCipher({
  id: 'caesar',
  name: 'Caesar',
  description: 'ciphers.caesar.description',
  difficulty: 'easy',
  options: [{ name: 'shift', type: 'number', default: 3, min: 1, max: 25 }],
  optionsSchema,
  encrypt: (text, { shift }) => shiftLetters(text, shift),
  decrypt: (text, { shift }) => shiftLetters(text, -shift),
  detect: (text) => lettersRatio(text) * 0.5,
  candidates: (text) =>
    Array.from({ length: 25 }, (_, i) => ({
      options: { shift: i + 1 },
      plaintext: shiftLetters(text, -(i + 1)),
    })),
});

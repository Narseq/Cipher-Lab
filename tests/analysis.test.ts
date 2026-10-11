import { describe, expect, it } from 'vitest';
import { analyzeText } from '@/lib/analysis/solve';
import { languageScore } from '@/lib/analysis/language';
import { letterFrequencies, textStats } from '@/lib/analysis/stats';
import { normalizeAnswer } from '@/lib/answer';
import { getCipher, runCipher } from '@/lib/ciphers';

const PROSE = 'The secret message is hidden in the old library and you will find the key there';

function encrypt(id: string, text: string, options = {}) {
  const cipher = getCipher(id);
  if (!cipher) throw new Error(id);
  return runCipher(cipher, 'encrypt', text, options);
}

describe('languageScore', () => {
  it('rates prose above gibberish', () => {
    expect(languageScore(PROSE)).toBeGreaterThan(0.6);
    expect(languageScore('Xqzv kjwp zzzq vxkj')).toBeLessThan(0.3);
  });

  it('recognises Polish', () => {
    expect(languageScore('To jest tajne hasło i nie wiadomo, gdzie jest kod')).toBeGreaterThan(0.5);
  });
});

describe('analyzeText', () => {
  it('returns nothing for empty input', () => {
    expect(analyzeText('   ')).toEqual([]);
  });

  it.each([
    ['caesar', { shift: 5 }],
    ['atbash', {}],
    ['base64', {}],
    ['base32', {}],
    ['hex', {}],
    ['binary', {}],
  ])('finds the plaintext of %s', (id, options) => {
    const results = analyzeText(encrypt(id, PROSE, options));
    expect(results[0]?.plaintext).toBe(PROSE);
  });

  it('identifies morse and a1z26', () => {
    const morse = analyzeText(encrypt('morse', 'THE SECRET MESSAGE IS HIDDEN'));
    expect(morse[0]?.cipherId).toBe('morse');
    const a1z26 = analyzeText(encrypt('a1z26', 'THE SECRET MESSAGE IS HIDDEN'));
    expect(a1z26[0]?.cipherId).toBe('a1z26');
  });

  it('recovers a Vigenère key from long enough text', () => {
    const results = analyzeText(encrypt('vigenere', PROSE, { key: 'CIPHER' }));
    expect(results.some((r) => r.cipherId === 'vigenere' && r.plaintext === PROSE)).toBe(true);
  });

  it('recovers a single-character XOR key', () => {
    const results = analyzeText(encrypt('xor', PROSE, { key: 'Q' }));
    expect(results.some((r) => r.cipherId === 'xor' && r.plaintext === PROSE)).toBe(true);
  });

  it('does not repeat identical plaintexts', () => {
    const plaintexts = analyzeText(encrypt('rot13', PROSE)).map((r) => r.plaintext);
    expect(new Set(plaintexts).size).toBe(plaintexts.length);
  });
});

describe('textStats', () => {
  it('counts characters, words, digits and special characters', () => {
    expect(textStats('Hello, world 42!')).toEqual({
      characters: 16,
      words: 3,
      digits: 2,
      special: 2,
    });
  });
});

describe('letterFrequencies', () => {
  it('reports percentages for A-Z', () => {
    const frequencies = letterFrequencies('aab');
    expect(frequencies).toHaveLength(26);
    expect(frequencies[0]).toEqual({ letter: 'A', count: 2, percent: 66.7 });
  });
});

describe('normalizeAnswer', () => {
  it('ignores case, accents, punctuation and spacing', () => {
    expect(normalizeAnswer('  Zażółć   GĘŚLĄ jaźń! ')).toBe('zazolc gesla jazn');
  });
});

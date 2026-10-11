import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import en from '../messages/en.json';
import pl from '../messages/pl.json';
import { ACHIEVEMENT_CODES } from '@/lib/achievements';
import { ciphers } from '@/lib/ciphers';
import { isLocale, routing } from '@/i18n/routing';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((flat, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...flat, [path]: value }
      : { ...flat, ...flatten(value, path) };
  }, {});
}

const flatEn = flatten(en as Tree);
const flatPl = flatten(pl as Tree);

/** Names of the ICU arguments a message uses, e.g. "{count, plural, ...}" -> count. */
function placeholders(message: string): string[] {
  const names = new Set<string>();
  const pattern = /\{\s*([A-Za-z_]\w*)\s*[,}]/g;
  for (const match of message.matchAll(pattern)) if (match[1]) names.add(match[1]);
  return [...names].sort();
}

describe('translation files', () => {
  it('define exactly the same keys in English and Polish', () => {
    expect(Object.keys(flatPl).sort()).toEqual(Object.keys(flatEn).sort());
  });

  it('have no empty messages', () => {
    for (const [key, value] of [...Object.entries(flatEn), ...Object.entries(flatPl)]) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('use the same ICU arguments in both languages', () => {
    for (const [key, message] of Object.entries(flatEn)) {
      expect(placeholders(flatPl[key] ?? ''), key).toEqual(placeholders(message));
    }
  });

  it('describe every cipher and every badge', () => {
    for (const cipher of ciphers) {
      expect(flatEn[`${cipher.description}`], cipher.id).toBeTruthy();
      expect(flatPl[`${cipher.description}`], cipher.id).toBeTruthy();
    }
    for (const code of ACHIEVEMENT_CODES) {
      for (const field of ['name', 'description']) {
        expect(flatEn[`badges.${code}.${field}`], code).toBeTruthy();
        expect(flatPl[`badges.${code}.${field}`], code).toBeTruthy();
      }
    }
  });

  it('keep proper names untranslated', () => {
    for (const name of ['Caesar', 'Base64', 'Morse', 'Vigenère', 'XOR']) {
      expect(flatPl['meta.solver.description']).toContain(name);
    }
    expect(flatPl['meta.home.title']).toContain('Cipher Lab');
  });
});

describe('locale configuration', () => {
  it('defaults to English and supports Polish', () => {
    expect(routing.defaultLocale).toBe('en');
    expect([...routing.locales]).toEqual(['en', 'pl']);
    expect(isLocale('pl')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('pluralization', () => {
  const english = createTranslator({ locale: 'en', messages: en });
  const polish = createTranslator({ locale: 'pl', messages: pl });

  it('uses singular and plural in English', () => {
    expect(english('puzzles.card.attempts', { count: 1 })).toBe('1 attempt');
    expect(english('puzzles.card.attempts', { count: 2 })).toBe('2 attempts');
    expect(english('puzzles.card.attempts', { count: 0 })).toBe('0 attempts');
  });

  it.each([
    [1, '1 próba'],
    [2, '2 próby'],
    [4, '4 próby'],
    [5, '5 prób'],
    [12, '12 prób'],
    [22, '22 próby'],
    [25, '25 prób'],
  ])('uses the right Polish form for %i attempts', (count, expected) => {
    expect(polish('puzzles.card.attempts', { count })).toBe(expected);
  });

  it('pluralizes seconds with a variable', () => {
    expect(english('play.solved.solvedIn', { seconds: 1 })).toBe('Solved in 1 second');
    expect(english('play.solved.solvedIn', { seconds: 42 })).toBe('Solved in 42 seconds');
    expect(polish('play.solved.solvedIn', { seconds: 1 })).toBe('Rozwiązano w 1 sekundę');
    expect(polish('play.solved.solvedIn', { seconds: 3 })).toBe('Rozwiązano w 3 sekundy');
    expect(polish('play.solved.solvedIn', { seconds: 7 })).toBe('Rozwiązano w 7 sekund');
  });

  it('handles the empty gallery count', () => {
    expect(english('puzzles.count', { count: 0 })).toBe('No puzzles');
    expect(polish('puzzles.count', { count: 0 })).toBe('Brak zagadek');
    expect(polish('puzzles.count', { count: 3 })).toBe('3 zagadki');
    expect(polish('puzzles.count', { count: 11 })).toBe('11 zagadek');
  });
});

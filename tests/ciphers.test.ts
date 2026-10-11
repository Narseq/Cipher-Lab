import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CipherError, ciphers, getCipher, runCipher } from '@/lib/ciphers';

const SAMPLE = 'Hello, World! The secret code is 42.';

const OPTIONS: Record<string, Record<string, string | number>> = {
  caesar: { shift: 7 },
  vigenere: { key: 'Lemon' },
  xor: { key: 'k3y' },
};

function cipherById(id: string) {
  const cipher = getCipher(id);
  if (!cipher) throw new Error(`missing cipher ${id}`);
  return cipher;
}

describe('cipher registry', () => {
  it('registers every cipher file in the folder', () => {
    const dir = path.resolve(__dirname, '../src/lib/ciphers');
    const infrastructure = ['define', 'errors', 'index', 'types', 'utils'];
    const files = readdirSync(dir)
      .filter((file) => file.endsWith('.ts'))
      .map((file) => file.replace(/\.ts$/, ''))
      .filter((name) => !infrastructure.includes(name));
    // hex.ts also exports helpers but is a cipher itself
    expect(ciphers.map((cipher) => cipher.id).sort()).toEqual(files.sort());
  });

  it('exposes the common interface on every cipher', () => {
    for (const cipher of ciphers) {
      expect(cipher.name).toBeTruthy();
      expect(cipher.description).toBe(`ciphers.${cipher.id}.description`);
      expect(['easy', 'medium', 'hard', 'expert']).toContain(cipher.difficulty);
      expect(typeof cipher.encrypt).toBe('function');
      expect(typeof cipher.decrypt).toBe('function');
      expect(typeof cipher.detect).toBe('function');
    }
  });

  it('has unique ids', () => {
    expect(new Set(ciphers.map((c) => c.id)).size).toBe(ciphers.length);
  });
});

describe('round trips', () => {
  const lossy = new Set(['morse', 'a1z26']);
  const text = (id: string) => (lossy.has(id) ? 'HELLO WORLD' : SAMPLE);

  for (const cipher of ciphers) {
    it(`${cipher.id} decrypts what it encrypts`, () => {
      const options = OPTIONS[cipher.id] ?? {};
      const encrypted = runCipher(cipher, 'encrypt', text(cipher.id), options);
      expect(runCipher(cipher, 'decrypt', encrypted, options)).toBe(text(cipher.id));
    });
  }

  // letter-substitution ciphers look like prose, so only encodings have a detectable format
  const letterCiphers = new Set(['caesar', 'rot13', 'atbash', 'vigenere']);
  for (const cipher of ciphers.filter((c) => !letterCiphers.has(c.id))) {
    it(`${cipher.id} detects its own output better than plain prose`, () => {
      const encrypted = runCipher(cipher, 'encrypt', text(cipher.id), OPTIONS[cipher.id] ?? {});
      expect(cipher.detect(encrypted)).toBeGreaterThan(cipher.detect('Nothing to see here'));
    });
  }
});

describe('known vectors', () => {
  const encrypt = (id: string, text: string, options = {}) =>
    runCipher(cipherById(id), 'encrypt', text, options);
  const decrypt = (id: string, text: string, options = {}) =>
    runCipher(cipherById(id), 'decrypt', text, options);

  it('caesar', () => {
    expect(encrypt('caesar', 'Hello, World!', { shift: 3 })).toBe('Khoor, Zruog!');
    expect(decrypt('caesar', 'Khoor, Zruog!', { shift: 3 })).toBe('Hello, World!');
  });

  it('rot13', () => {
    expect(encrypt('rot13', 'Hello')).toBe('Uryyb');
  });

  it('atbash', () => {
    expect(encrypt('atbash', 'Hello')).toBe('Svool');
  });

  it('base64', () => {
    expect(encrypt('base64', 'Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==');
    expect(decrypt('base64', 'SGVsbG8sIFdvcmxkIQ')).toBe('Hello, World!');
    expect(encrypt('base64', 'zażółć')).toBe('emHFvMOzxYLEhw==');
    expect(decrypt('base64', 'emHFvMOzxYLEhw==')).toBe('zażółć');
  });

  it('base32', () => {
    expect(encrypt('base32', 'foobar')).toBe('MZXW6YTBOI======');
    expect(decrypt('base32', 'mzxw6ytboi')).toBe('foobar');
  });

  it('hex', () => {
    expect(encrypt('hex', 'Hi!')).toBe('48 69 21');
    expect(decrypt('hex', '0x48,0x69,0x21')).toBe('Hi!');
  });

  it('binary', () => {
    expect(encrypt('binary', 'Hi')).toBe('01001000 01101001');
    expect(decrypt('binary', '0100100001101001')).toBe('Hi');
  });

  it('morse', () => {
    expect(encrypt('morse', 'SOS HELP')).toBe('... --- ... | .... . .-.. .--.');
    expect(decrypt('morse', '... --- ...   .... . .-.. .--.')).toBe('SOS HELP');
  });

  it('a1z26', () => {
    expect(encrypt('a1z26', 'Hello world')).toBe('8-5-12-12-15 23-15-18-12-4');
    expect(decrypt('a1z26', '8 5 12 12 15 / 23 15 18 12 4')).toBe('HELLO WORLD');
  });

  it('vigenere', () => {
    expect(encrypt('vigenere', 'ATTACKATDAWN', { key: 'LEMON' })).toBe('LXFOPVEFRNHR');
    expect(decrypt('vigenere', 'LXFOPVEFRNHR', { key: 'LEMON' })).toBe('ATTACKATDAWN');
  });

  it('xor', () => {
    expect(encrypt('xor', 'Hi', { key: 'K' })).toBe('03 22');
    expect(decrypt('xor', '03 22', { key: 'K' })).toBe('Hi');
  });
});

describe('errors', () => {
  it('rejects malformed input with a CipherError', () => {
    expect(() => runCipher(cipherById('binary'), 'decrypt', '1012', {})).toThrow(CipherError);
    expect(() => runCipher(cipherById('base64'), 'decrypt', '***', {})).toThrow(CipherError);
    expect(() => runCipher(cipherById('morse'), 'encrypt', 'ż', {})).toThrow(CipherError);
  });

  it('rejects invalid options', () => {
    expect(() => runCipher(cipherById('caesar'), 'encrypt', 'a', { shift: 99 })).toThrow(
      CipherError,
    );
    expect(() => runCipher(cipherById('vigenere'), 'encrypt', 'a', { key: '123' })).toThrow(
      CipherError,
    );
    expect(() => runCipher(cipherById('xor'), 'encrypt', 'a', { key: '' })).toThrow(CipherError);
  });
});

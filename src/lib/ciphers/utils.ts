import { CipherError } from './errors';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export function toBytes(text: string): Uint8Array {
  return encoder.encode(text);
}

export function fromBytes(bytes: Uint8Array): string {
  try {
    return decoder.decode(bytes);
  } catch {
    throw new CipherError('invalidInput');
  }
}

/** Shifts A-Z / a-z by `shift` positions, leaving every other character untouched. */
export function shiftLetters(text: string, shift: number): string {
  const offset = ((shift % 26) + 26) % 26;
  return text.replace(/[a-z]/gi, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + offset) % 26) + base);
  });
}

export function lettersRatio(text: string): number {
  const visible = text.replace(/\s/g, '');
  if (visible.length === 0) return 0;
  return (visible.match(/[a-z]/gi)?.length ?? 0) / visible.length;
}

export function stripWhitespace(text: string): string {
  return text.replace(/\s+/g, '');
}

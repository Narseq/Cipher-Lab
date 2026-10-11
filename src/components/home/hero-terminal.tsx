import { DecodeText } from '@/components/decode-text';
import caesar from '@/lib/ciphers/caesar';

const MESSAGE = 'Meet me at midnight';
const SHIFT = 3;

/** Decorative terminal that decodes a Caesar-encrypted line. */
export function HeroTerminal() {
  const encrypted = caesar.encrypt(MESSAGE, { shift: SHIFT });

  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-surface font-mono text-sm shadow-lg"
      aria-hidden
    >
      <div className="flex gap-1.5 border-b border-border bg-surface-raised px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-danger" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-muted">$ cipher-lab decode caesar --shift {SHIFT}</p>
        <p className="break-all text-warning">{encrypted}</p>
        <p className="text-accent">
          &gt; <DecodeText text={MESSAGE} duration={1800} />
          <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-accent" />
        </p>
      </div>
    </div>
  );
}

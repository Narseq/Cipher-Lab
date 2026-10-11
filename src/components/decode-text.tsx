'use client';

import { useEffect, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=?';
const TICK_MS = 40;

function scramble(text: string, revealed: number): string {
  return [...text]
    .map((char, index) =>
      index < revealed || !/[\p{L}\p{Nd}]/u.test(char)
        ? char
        : (GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? char),
    )
    .join('');
}

interface DecodeTextProps {
  text: string;
  /** Total time the text takes to resolve, in milliseconds. */
  duration?: number;
  className?: string;
}

/** Shows scrambled glyphs that resolve left to right into `text`, like a terminal decoding. */
export function DecodeText({ text, duration = 1400, className }: DecodeTextProps) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      const length = [...text].length;
      setShown(progress >= 1 ? text : scramble(text, Math.floor(progress * length)));
      if (progress >= 1) window.clearInterval(timer);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [text, duration]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{shown}</span>
    </span>
  );
}

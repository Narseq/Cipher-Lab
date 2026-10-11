'use client';

import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LetterFrequency } from '@/lib/analysis/stats';

interface FrequencyChartProps {
  input: LetterFrequency[];
  /** Frequencies of the selected result, shown next to the input when available. */
  result?: LetterFrequency[];
}

export function FrequencyChart({ input, result }: FrequencyChartProps) {
  const t = useTranslations('solver.frequency');

  const data = input.map((entry, index) => ({
    letter: entry.letter,
    input: entry.percent,
    result: result?.[index]?.percent ?? 0,
  }));

  return (
    <div role="img" aria-label={t('chartLabel')} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="letter" stroke="var(--muted)" fontSize={12} interval={0} />
          <YAxis stroke="var(--muted)" fontSize={12} unit="%" />
          <Tooltip
            cursor={{ fill: 'var(--surface-raised)' }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--foreground)',
            }}
            formatter={(value) => `${value}%`}
          />
          <Bar dataKey="input" name={t('input')} fill="var(--warning)" radius={[2, 2, 0, 0]} />
          {result && (
            <Bar dataKey="result" name={t('result')} fill="var(--accent)" radius={[2, 2, 0, 0]} />
          )}
          <Legend />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

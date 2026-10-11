'use client';

import { motion } from 'framer-motion';
import { Check, Copy, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CipherOptionsFields,
  defaultOptionValues,
  toCipherOptions,
} from '@/components/cipher-options';
import { Badge, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Select, Textarea } from '@/components/ui/input';
import { analyzeText, type SolverResult } from '@/lib/analysis/solve';
import { letterFrequencies, textStats } from '@/lib/analysis/stats';
import { CipherError, ciphers, getCipher, runCipher, type CipherOptions } from '@/lib/ciphers';
import { cn } from '@/lib/utils';
import { useTranslated } from '@/lib/use-translated';
import { FrequencyChart } from './frequency-chart';

type Mode = 'auto' | 'manual';
type Operation = 'decrypt' | 'encrypt';

interface Reading {
  cipherId: string;
  options: CipherOptions;
  text: string;
}

const readingKey = (reading: Reading, operation: Operation) =>
  `${operation}:${reading.cipherId}:${JSON.stringify(reading.options)}`;

export function SolverWorkbench() {
  const t = useTranslations('solver');
  const { cipherError, optionsSummary } = useTranslated();

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('auto');
  const [results, setResults] = useState<SolverResult[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [manualId, setManualId] = useState(ciphers[0]?.id ?? '');
  const [operation, setOperation] = useState<Operation>('decrypt');
  const [optionValues, setOptionValues] = useState(() =>
    ciphers[0] ? defaultOptionValues(ciphers[0]) : {},
  );
  const [markedCorrect, setMarkedCorrect] = useState<string | null>(null);

  const manualCipher = getCipher(manualId);

  const manual = useMemo(() => {
    if (!manualCipher || input.trim() === '') return null;
    try {
      const options = toCipherOptions(manualCipher, optionValues);
      return {
        reading: {
          cipherId: manualCipher.id,
          options,
          text: runCipher(manualCipher, operation, input, options),
        } satisfies Reading,
      };
    } catch (error) {
      if (error instanceof CipherError) return { error: cipherError(error) };
      throw error;
    }
  }, [manualCipher, input, operation, optionValues, cipherError]);

  const autoReading: Reading | null = results?.[selected]
    ? {
        cipherId: results[selected].cipherId,
        options: results[selected].options,
        text: results[selected].plaintext,
      }
    : null;
  const reading = mode === 'auto' ? autoReading : (manual?.reading ?? null);
  const manualError = mode === 'manual' ? (manual?.error ?? null) : null;

  const stats = textStats(input);
  const inputFrequencies = useMemo(() => letterFrequencies(input), [input]);
  const readingFrequencies = useMemo(
    () => (reading ? letterFrequencies(reading.text) : undefined),
    [reading],
  );

  function analyze() {
    setResults(analyzeText(input));
    setSelected(0);
    setMarkedCorrect(null);
  }

  function chooseCipher(id: string) {
    setManualId(id);
    const next = getCipher(id);
    setOptionValues(next ? defaultOptionValues(next) : {});
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  }

  const activeKey = reading ? readingKey(reading, mode === 'auto' ? 'decrypt' : operation) : null;
  const isMarked = activeKey !== null && markedCorrect === activeKey;

  function toggleMarked() {
    if (!activeKey) return;
    setMarkedCorrect(isMarked ? null : activeKey);
    if (!isMarked) toast.success(t('markedCorrectToast'));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <Field id="solver-input" label={t('input')}>
            <Textarea
              id="solver-input"
              rows={7}
              value={input}
              placeholder={t('inputPlaceholder')}
              spellCheck={false}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (mode === 'auto' && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  analyze();
                }
              }}
            />
          </Field>

          <fieldset className="flex gap-2">
            <legend className="mb-1.5 text-sm font-medium">{t('mode.label')}</legend>
            {(['auto', 'manual'] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={mode === value ? 'primary' : 'outline'}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {t(`mode.${value}`)}
              </Button>
            ))}
          </fieldset>

          {mode === 'auto' ? (
            <div className="flex gap-2">
              <Button type="button" onClick={analyze} disabled={input.trim() === ''}>
                <Search className="h-4 w-4" aria-hidden />
                {t('analyze')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInput('');
                  setResults(null);
                }}
                disabled={input === ''}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('clear')}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="solver-cipher" label={t('cipher')}>
                <Select
                  id="solver-cipher"
                  value={manualId}
                  onChange={(event) => chooseCipher(event.target.value)}
                >
                  {ciphers.map((cipher) => (
                    <option key={cipher.id} value={cipher.id}>
                      {cipher.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="solver-operation" label={t('operation.label')}>
                <Select
                  id="solver-operation"
                  value={operation}
                  onChange={(event) =>
                    setOperation(event.target.value === 'encrypt' ? 'encrypt' : 'decrypt')
                  }
                >
                  <option value="decrypt">{t('operation.decrypt')}</option>
                  <option value="encrypt">{t('operation.encrypt')}</option>
                </Select>
              </Field>
              {manualCipher && (
                <CipherOptionsFields
                  cipher={manualCipher}
                  values={optionValues}
                  onChange={setOptionValues}
                  idPrefix="solver-option"
                />
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-muted">
            {t('stats.title')}
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['characters', 'words', 'digits', 'special'] as const).map((key) => (
              <div key={key}>
                <dt className="text-xs text-muted">{t(`stats.${key}`)}</dt>
                <dd className="font-mono text-2xl">{stats[key]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {mode === 'auto' && (
          <Card aria-live="polite">
            <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-muted">
              {t('results.title')}
            </h2>
            {results === null && <p className="text-sm text-muted">{t('results.idle')}</p>}
            {results !== null && results.length === 0 && (
              <p className="text-sm text-muted">{t('results.empty')}</p>
            )}
            <ol className="flex flex-col gap-2">
              {results?.map((result, index) => {
                const cipher = getCipher(result.cipherId);
                const active = index === selected;
                const options = optionsSummary(result.options);
                return (
                  <motion.li
                    key={`${result.cipherId}-${JSON.stringify(result.options)}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelected(index)}
                      className={cn(
                        'w-full rounded-md border p-3 text-left transition-colors hover:bg-surface-raised',
                        active ? 'border-accent bg-surface-raised' : 'border-border',
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold">{cipher?.name}</span>
                        {options && <Badge>{options}</Badge>}
                        <span className="ml-auto font-mono text-sm text-accent">
                          {t('results.confidence', {
                            percent: Math.round(result.confidence * 100),
                          })}
                        </span>
                      </span>
                      <span className="mt-1 block truncate font-mono text-sm text-muted">
                        {result.plaintext}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ol>
          </Card>
        )}

        <Card aria-live="polite">
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-muted">
            {t('output.title')}
          </h2>
          {manualError && (
            <p role="alert" className="text-sm text-danger">
              {manualError}
            </p>
          )}
          {!manualError && !reading && <p className="text-sm text-muted">{t('output.empty')}</p>}
          {reading && (
            <>
              <p className="mb-1 text-xs text-muted">
                {getCipher(reading.cipherId)?.name}
                {Object.keys(reading.options).length > 0 && ` · ${optionsSummary(reading.options)}`}
              </p>
              <pre
                data-testid="solver-output"
                className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-sm"
              >
                {reading.text}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copy(reading.text)}
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  {t('copy')}
                </Button>
                <Button
                  type="button"
                  variant={isMarked ? 'primary' : 'outline'}
                  size="sm"
                  aria-pressed={isMarked}
                  onClick={toggleMarked}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {isMarked ? t('markedCorrect') : t('markCorrect')}
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card>
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-muted">
            {t('frequency.title')}
          </h2>
          <p className="mb-3 mt-1 text-sm text-muted">{t('frequency.description')}</p>
          {input.trim() === '' ? (
            <p className="text-sm text-muted">{t('frequency.empty')}</p>
          ) : (
            <FrequencyChart input={inputFrequencies} result={readingFrequencies} />
          )}
        </Card>
      </div>
    </div>
  );
}

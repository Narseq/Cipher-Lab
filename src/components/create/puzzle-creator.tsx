'use client';

import { Copy, Languages, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  CipherOptionsFields,
  defaultOptionValues,
  toCipherOptions,
} from '@/components/cipher-options';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { fieldIssues } from '@/lib/api-types';
import { postJson } from '@/lib/api-client';
import { CipherError, ciphers, getCipher, runCipher } from '@/lib/ciphers';
import { DIFFICULTIES, MAX_HINTS } from '@/lib/scoring';
import { useTranslated } from '@/lib/use-translated';
import { createPuzzleSchema } from '@/lib/validation/puzzle';

interface TextDraft {
  title: string;
  description: string;
  explanation: string;
  hints: string[];
}

const emptyDraft = (): TextDraft => ({ title: '', description: '', explanation: '', hints: [] });

const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'pl' : 'en');

function toNumberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

export function PuzzleCreator() {
  const t = useTranslations('create');
  const tDifficulty = useTranslations('difficulty');
  const tLanguage = useTranslations('language');
  const uiLocale = useLocale() as Locale;
  const router = useRouter();
  const { issue, apiError, cipherError, cipherDescription } = useTranslated();

  const [originalLocale, setOriginalLocale] = useState<Locale>(uiLocale);
  const [drafts, setDrafts] = useState<Record<Locale, TextDraft>>({
    en: emptyDraft(),
    pl: emptyDraft(),
  });
  const [withTranslation, setWithTranslation] = useState(false);
  const [cipherId, setCipherId] = useState(ciphers[0]?.id ?? '');
  const [optionValues, setOptionValues] = useState(() =>
    ciphers[0] ? defaultOptionValues(ciphers[0]) : {},
  );
  const [plaintext, setPlaintext] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('easy');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const cipher = getCipher(cipherId);
  const translationLocale = otherLocale(originalLocale);

  const preview = useMemo(() => {
    if (!cipher || plaintext.trim() === '') return null;
    try {
      return {
        text: runCipher(cipher, 'encrypt', plaintext, toCipherOptions(cipher, optionValues)),
      };
    } catch (error) {
      if (error instanceof CipherError) return { error: cipherError(error) };
      return { error: issue('cipherInvalidKey') };
    }
  }, [cipher, plaintext, optionValues, cipherError, issue]);

  function updateDraft(locale: Locale, patch: Partial<TextDraft>) {
    setDrafts((current) => ({ ...current, [locale]: { ...current[locale], ...patch } }));
  }

  function changeCipher(id: string) {
    setCipherId(id);
    const next = getCipher(id);
    setOptionValues(next ? defaultOptionValues(next) : {});
  }

  function addHint(locale: Locale) {
    if (drafts[locale].hints.length >= MAX_HINTS) return;
    updateDraft(locale, { hints: [...drafts[locale].hints, ''] });
    if (withTranslation)
      updateDraft(otherLocale(locale), { hints: [...drafts[otherLocale(locale)].hints, ''] });
  }

  function removeHint(locale: Locale, index: number) {
    const drop = (list: string[]) => list.filter((_, i) => i !== index);
    updateDraft(locale, { hints: drop(drafts[locale].hints) });
    if (withTranslation)
      updateDraft(otherLocale(locale), { hints: drop(drafts[otherLocale(locale)].hints) });
  }

  function setHintText(locale: Locale, index: number, text: string) {
    updateDraft(locale, {
      hints: drafts[locale].hints.map((hint, i) => (i === index ? text : hint)),
    });
  }

  function toggleTranslation() {
    const enable = !withTranslation;
    setWithTranslation(enable);
    if (enable) {
      // Hints are paired by position, so the translation starts with matching empty slots.
      const count = drafts[originalLocale].hints.length;
      updateDraft(translationLocale, { hints: Array.from({ length: count }, () => '') });
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const candidate = {
      cipherId,
      cipherOptions: cipher ? toCipherOptions(cipher, optionValues) : {},
      plaintext,
      difficulty,
      maxAttempts: toNumberOrNull(maxAttempts),
      timeLimitSeconds: toNumberOrNull(timeLimit),
      originalLocale,
      translations: {
        [originalLocale]: drafts[originalLocale],
        ...(withTranslation && { [translationLocale]: drafts[translationLocale] }),
      },
      tags: tags
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#/, ''))
        .filter(Boolean),
    };

    const parsed = createPuzzleSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          Object.entries(fieldIssues(parsed.error)).map(([k, v]) => [k, issue(v)]),
        ),
      );
      return;
    }
    setErrors({});
    setPending(true);
    const response = await postJson<{ id: string }>('/api/puzzles', parsed.data);
    setPending(false);

    if (!response.ok) {
      if (response.error.issues) {
        setErrors(
          Object.fromEntries(Object.entries(response.error.issues).map(([k, v]) => [k, issue(v)])),
        );
      } else {
        setFormError(apiError(response.error.code));
      }
      return;
    }
    setCreatedId(response.data.id);
  }

  const err = (path: string) => errors[path];
  // Only evaluated once a puzzle exists, i.e. after a client-side submit.
  const publicLink = createdId ? `${window.location.origin}/${uiLocale}/puzzle/${createdId}` : '';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicLink);
      toast.success(t('success.copied'));
    } catch {
      toast.error(t('success.copyFailed'));
    }
  }

  function textFields(locale: Locale) {
    const draft = drafts[locale];
    const prefix = `translations.${locale}`;
    const idPrefix = `create-${locale}`;
    return (
      <div className="flex flex-col gap-4" lang={locale}>
        <Field id={`${idPrefix}-title`} label={t('fields.title')} error={err(`${prefix}.title`)}>
          <Input
            id={`${idPrefix}-title`}
            value={draft.title}
            maxLength={80}
            aria-invalid={err(`${prefix}.title`) ? true : undefined}
            onChange={(event) => updateDraft(locale, { title: event.target.value })}
          />
        </Field>
        <Field
          id={`${idPrefix}-description`}
          label={t('fields.description')}
          error={err(`${prefix}.description`)}
        >
          <Textarea
            id={`${idPrefix}-description`}
            value={draft.description}
            rows={3}
            className="font-sans"
            onChange={(event) => updateDraft(locale, { description: event.target.value })}
          />
        </Field>
        <Field
          id={`${idPrefix}-explanation`}
          label={t('fields.explanation')}
          hint={t('fields.explanationHint')}
          error={err(`${prefix}.explanation`)}
        >
          <Textarea
            id={`${idPrefix}-explanation`}
            value={draft.explanation}
            rows={2}
            className="font-sans"
            onChange={(event) => updateDraft(locale, { explanation: event.target.value })}
          />
        </Field>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">{t('fields.hints')}</legend>
          {draft.hints.map((hint, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <Field
                  id={`${idPrefix}-hint-${index}`}
                  label={t('fields.hintN', { number: index + 1 })}
                  error={err(`${prefix}.hints.${index}`)}
                >
                  <Input
                    id={`${idPrefix}-hint-${index}`}
                    value={hint}
                    maxLength={300}
                    onChange={(event) => setHintText(locale, index, event.target.value)}
                  />
                </Field>
              </div>
              {locale === originalLocale && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-7"
                  aria-label={t('fields.removeHint', { number: index + 1 })}
                  onClick={() => removeHint(locale, index)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          ))}
          {err(`translations.${locale}.hints`) && (
            <p role="alert" className="text-xs text-danger">
              {err(`translations.${locale}.hints`)}
            </p>
          )}
          {locale === originalLocale && draft.hints.length < MAX_HINTS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => addHint(locale)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('fields.addHint')}
            </Button>
          )}
        </fieldset>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-mono text-lg font-semibold">
              {t('sections.text', { language: tLanguage(`names.${originalLocale}`) })}
            </h2>
            <div className="w-48">
              <Field id="create-original-locale" label={t('fields.originalLanguage')}>
                <Select
                  id="create-original-locale"
                  value={originalLocale}
                  onChange={(event) => {
                    const next = routing.locales.find((code) => code === event.target.value);
                    if (next) setOriginalLocale(next);
                  }}
                >
                  {routing.locales.map((code) => (
                    <option key={code} value={code}>
                      {tLanguage(`names.${code}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
          {textFields(originalLocale)}
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-mono text-lg font-semibold">{t('sections.translation')}</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={withTranslation}
              onClick={toggleTranslation}
            >
              <Languages className="h-4 w-4" aria-hidden />
              {withTranslation
                ? t('translation.remove')
                : t(`translation.add.${translationLocale}`)}
            </Button>
          </div>
          {withTranslation ? (
            textFields(translationLocale)
          ) : (
            <p className="text-sm text-muted">{t('translation.hint')}</p>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-mono text-lg font-semibold">{t('sections.cipher')}</h2>
          <Field
            id="create-plaintext"
            label={t('fields.plaintext')}
            hint={t('fields.plaintextHint')}
            error={err('plaintext')}
          >
            <Textarea
              id="create-plaintext"
              value={plaintext}
              rows={3}
              maxLength={500}
              onChange={(event) => setPlaintext(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="create-cipher"
              label={t('fields.cipher')}
              hint={cipher ? cipherDescription(cipher) : undefined}
            >
              <Select
                id="create-cipher"
                value={cipherId}
                onChange={(event) => changeCipher(event.target.value)}
              >
                {ciphers.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </Select>
            </Field>
            {cipher && (
              <CipherOptionsFields
                cipher={cipher}
                values={optionValues}
                onChange={setOptionValues}
                idPrefix="create-option"
                error={err('cipherOptions')}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{t('fields.preview')}</p>
            {preview === null && (
              <p className="mt-1 text-sm text-muted">{t('fields.previewEmpty')}</p>
            )}
            {preview && 'error' in preview && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {preview.error}
              </p>
            )}
            {preview && 'text' in preview && (
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-background p-3 font-mono text-sm text-accent">
                {preview.text}
              </pre>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-mono text-lg font-semibold">{t('sections.rules')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="create-difficulty" label={t('fields.difficulty')}>
              <Select
                id="create-difficulty"
                value={difficulty}
                onChange={(event) => {
                  const next = DIFFICULTIES.find((value) => value === event.target.value);
                  if (next) setDifficulty(next);
                }}
              >
                {DIFFICULTIES.map((value) => (
                  <option key={value} value={value}>
                    {tDifficulty(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="create-attempts"
              label={t('fields.maxAttempts')}
              hint={t('fields.unlimitedHint')}
              error={err('maxAttempts')}
            >
              <Input
                id="create-attempts"
                type="number"
                min={1}
                max={100}
                value={maxAttempts}
                onChange={(event) => setMaxAttempts(event.target.value)}
              />
            </Field>
            <Field
              id="create-time"
              label={t('fields.timeLimit')}
              hint={t('fields.unlimitedHint')}
              error={err('timeLimitSeconds')}
            >
              <Input
                id="create-time"
                type="number"
                min={30}
                max={86400}
                value={timeLimit}
                onChange={(event) => setTimeLimit(event.target.value)}
              />
            </Field>
          </div>
          <Field
            id="create-tags"
            label={t('fields.tags')}
            hint={t('fields.tagsHint')}
            error={err('tags')}
          >
            <Input
              id="create-tags"
              value={tags}
              placeholder={t('fields.tagsPlaceholder')}
              onChange={(event) => setTags(event.target.value)}
            />
          </Field>
        </Card>

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending} className="self-start">
          {pending ? t('pending') : t('submit')}
        </Button>
      </form>

      <Dialog
        open={createdId !== null}
        onOpenChange={() => createdId && router.push(`/puzzle/${createdId}`)}
        title={t('success.title')}
        description={t('success.description')}
      >
        <div className="flex flex-col gap-3">
          <Input
            readOnly
            value={publicLink}
            aria-label={t('success.linkLabel')}
            onFocus={(event) => event.target.select()}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" aria-hidden />
              {t('success.copy')}
            </Button>
            {createdId && (
              <Button asChild>
                <Link href={`/puzzle/${createdId}`}>{t('success.open')}</Link>
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}

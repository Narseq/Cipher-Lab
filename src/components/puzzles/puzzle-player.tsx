'use client';

import { motion } from 'framer-motion';
import { Award, Copy, Flame, Lightbulb, Lock, Send, Timer } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { DecodeText } from '@/components/decode-text';
import { Badge, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { apiFetch, postJson } from '@/lib/api-client';
import { getCipher } from '@/lib/ciphers';
import { HINT_PENALTY } from '@/lib/scoring';
import type {
  PlayState,
  PuzzleDetail,
  RevealedHint,
  SolveResult,
  SubmissionOutcome,
} from '@/lib/types';
import { useTranslated } from '@/lib/use-translated';
import { formatDuration } from '@/lib/utils';

interface PuzzlePlayerProps {
  puzzle: PuzzleDetail;
  loggedIn: boolean;
}

export function PuzzlePlayer({ puzzle, loggedIn }: PuzzlePlayerProps) {
  const t = useTranslations('play');
  const locale = useLocale();
  const { apiError, optionsSummary } = useTranslated();

  const [state, setState] = useState<PlayState | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  const query = `?locale=${locale}`;
  const base = `/api/puzzles/${puzzle.id}`;

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    apiFetch<PlayState>(`${base}/start${query}`, { method: 'POST' }).then((response) => {
      if (cancelled) return;
      if (response.ok) setState(response.data);
      else setLoadFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loggedIn, base, query]);

  const solved = state?.result != null;
  const running = state !== null && !solved;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const elapsed = state ? Math.max(0, Math.floor((now - Date.parse(state.startedAt)) / 1000)) : 0;
  const remaining =
    puzzle.timeLimitSeconds === null ? null : Math.max(0, puzzle.timeLimitSeconds - elapsed);
  const timeUp = state !== null && !solved && (state.expired || remaining === 0);
  const attemptsLeft =
    puzzle.maxAttempts === null || !state ? null : puzzle.maxAttempts - state.attemptsUsed;
  const outOfAttempts = attemptsLeft !== null && attemptsLeft <= 0;
  const canAnswer = running && !timeUp && !outOfAttempts;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canAnswer || answer.trim() === '') return;
    setPending(true);
    setMessage(null);
    const response = await postJson<SubmissionOutcome>(`${base}/submissions${query}`, { answer });
    setPending(false);

    if (!response.ok) {
      setMessage(apiError(response.error.code));
      return;
    }
    const outcome = response.data;
    setState((current) =>
      current
        ? { ...current, attemptsUsed: outcome.attemptsUsed, result: outcome.result }
        : current,
    );
    if (outcome.correct) {
      toast.success(t('correctToast'));
    } else {
      setWrongCount((count) => count + 1);
      setMessage(t('wrong'));
      setAnswer('');
    }
  }

  async function revealHint(position: number) {
    const response = await postJson<RevealedHint>(`${base}/hints${query}`, { position });
    if (!response.ok) {
      setMessage(apiError(response.error.code));
      return;
    }
    const hint = response.data;
    setState((current) =>
      current && !current.hints.some((known) => known.position === hint.position)
        ? { ...current, hints: [...current.hints, hint].sort((a, b) => a.position - b.position) }
        : current,
    );
  }

  async function copyCiphertext() {
    try {
      await navigator.clipboard.writeText(puzzle.ciphertext);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  }

  const nextHint = state ? state.hints.length + 1 : 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-muted">
              {t('message')}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={copyCiphertext}>
              <Copy className="h-4 w-4" aria-hidden />
              {t('copy')}
            </Button>
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-background p-4 font-mono text-lg text-accent">
            {puzzle.ciphertext}
          </pre>
        </Card>

        {!loggedIn && (
          <Card className="flex flex-col items-start gap-3">
            <Lock className="h-5 w-5 text-warning" aria-hidden />
            <p>{t('loginRequired')}</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={{ pathname: '/login', query: { next: `/puzzle/${puzzle.id}` } }}>
                  {t('login')}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={{ pathname: '/register', query: { next: `/puzzle/${puzzle.id}` } }}>
                  {t('register')}
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {loggedIn && !state && !loadFailed && <p className="text-muted">{t('loading')}</p>}
        {loadFailed && (
          <p role="alert" className="text-danger">
            {apiError('internal')}
          </p>
        )}

        {state && !solved && (
          <Card>
            <motion.form
              key={wrongCount}
              animate={wrongCount > 0 ? { x: [0, -8, 8, -6, 6, 0] } : undefined}
              transition={{ duration: 0.35 }}
              onSubmit={submit}
              className="flex flex-col gap-3"
            >
              <Field id="answer" label={t('answer')}>
                <Input
                  id="answer"
                  value={answer}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={!canAnswer}
                  placeholder={t('answerPlaceholder')}
                  onChange={(event) => setAnswer(event.target.value)}
                />
              </Field>
              {message && (
                <p role="alert" className="text-sm text-danger">
                  {message}
                </p>
              )}
              {timeUp && (
                <p role="alert" className="text-sm text-danger">
                  {t('timeUp')}
                </p>
              )}
              {outOfAttempts && !timeUp && (
                <p role="alert" className="text-sm text-danger">
                  {t('noAttemptsLeft')}
                </p>
              )}
              <Button type="submit" disabled={!canAnswer || pending || answer.trim() === ''}>
                <Send className="h-4 w-4" aria-hidden />
                {t('submit')}
              </Button>
            </motion.form>
          </Card>
        )}

        {state?.result && <SolvedPanel result={state.result} optionsSummary={optionsSummary} />}
      </div>

      <aside className="flex flex-col gap-4" aria-label={t('sidebar')}>
        <Card>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="flex items-center gap-1 text-xs text-muted">
                <Timer className="h-3.5 w-3.5" aria-hidden />
                {remaining === null ? t('elapsed') : t('remaining')}
              </dt>
              <dd className="font-mono text-2xl" data-testid="timer">
                {state ? formatDuration(remaining ?? elapsed) : '–:––'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('attemptsLabel')}</dt>
              <dd className="font-mono text-2xl">
                {state?.attemptsUsed ?? 0}
                {puzzle.maxAttempts !== null && ` / ${puzzle.maxAttempts}`}
              </dd>
            </div>
          </dl>
          {state && (
            <p className="mt-3 text-xs text-muted">
              {t('attemptsUsed', { count: state.attemptsUsed })}
            </p>
          )}
        </Card>

        {puzzle.hintCount > 0 && (
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-muted">
              <Lightbulb className="h-4 w-4" aria-hidden />
              {t('hints.title')}
            </h2>
            <ol className="flex flex-col gap-2">
              {state?.hints.map((hint) => (
                <li
                  key={hint.position}
                  className="rounded-md border border-border bg-background p-3 text-sm"
                >
                  <span className="font-mono text-xs text-muted">#{hint.position}</span>
                  <p>{hint.text}</p>
                </li>
              ))}
            </ol>
            {canAnswer && nextHint <= puzzle.hintCount && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => revealHint(nextHint)}
              >
                {t('hints.reveal', { position: nextHint, penalty: Math.round(HINT_PENALTY * 100) })}
              </Button>
            )}
            {(!state || state.hints.length === 0) && (
              <p className="mt-3 text-xs text-muted">
                {t('hints.available', { count: puzzle.hintCount })}
              </p>
            )}
          </Card>
        )}
      </aside>
    </div>
  );
}

function SolvedPanel({
  result,
  optionsSummary,
}: {
  result: SolveResult;
  optionsSummary: (options: SolveResult['cipherOptions']) => string;
}) {
  const t = useTranslations('play.solved');
  const { badgeName } = useTranslated();
  const cipher = getCipher(result.cipherId);
  const options = optionsSummary(result.cipherOptions);

  return (
    <Card className="flex flex-col gap-4 border-accent" aria-live="polite">
      <h2 className="font-mono text-xl font-semibold text-accent">{t('title')}</h2>
      <DecodeText
        text={result.plaintext}
        className="break-words rounded-md border border-border bg-background p-4 font-mono text-xl"
      />
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">{t('points')}</dt>
          <dd className="font-mono text-2xl text-accent">+{result.points}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-xs text-muted">{t('time')}</dt>
          <dd className="text-sm">{t('solvedIn', { seconds: result.elapsedSeconds })}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t('attempts')}</dt>
          <dd className="font-mono text-2xl">{result.attempts}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t('hintsUsed')}</dt>
          <dd className="font-mono text-2xl">{result.hintsUsed}</dd>
        </div>
      </dl>
      <p className="text-sm">
        <span className="text-muted">{t('cipher')}: </span>
        <span className="font-mono font-semibold">{cipher?.name}</span>
        {options && <Badge className="ml-2">{options}</Badge>}
      </p>
      {result.explanation && (
        <div>
          <h3 className="text-sm font-semibold">{t('explanation')}</h3>
          <p className="mt-1 text-sm text-muted">{result.explanation}</p>
        </div>
      )}
      {result.streak > 1 && (
        <p className="flex items-center gap-2 text-sm text-warning">
          <Flame className="h-4 w-4" aria-hidden />
          {t('streak', { days: result.streak })}
        </p>
      )}
      {result.newBadges.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Award className="h-4 w-4 text-warning" aria-hidden />
            {t('newBadges')}
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {result.newBadges.map((code) => (
              <li key={code}>
                <Badge className="border-warning text-warning">{badgeName(code)}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button asChild variant="outline" className="self-start">
        <Link href="/puzzles">{t('more')}</Link>
      </Button>
    </Card>
  );
}

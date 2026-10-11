'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/navigation';
import { fieldIssues } from '@/lib/api-types';
import { postJson } from '@/lib/api-client';
import { useTranslated } from '@/lib/use-translated';
import { loginSchema, registerSchema } from '@/lib/validation/auth';

interface AuthFormProps {
  mode: 'login' | 'register';
  /** Path to open after signing in; only same-site paths are honoured. */
  next?: string;
}

const isSafePath = (path: string | undefined): path is string =>
  path !== undefined && path.startsWith('/') && !path.startsWith('//');

export function AuthForm({ mode, next }: AuthFormProps) {
  const t = useTranslations(`auth.${mode}`);
  const tFields = useTranslations('auth.fields');
  const { issue, apiError } = useTranslated();
  const router = useRouter();

  const [values, setValues] = useState({ email: '', username: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const schema = mode === 'login' ? loginSchema : registerSchema;
    const parsed = schema.safeParse(values);
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
    const response = await postJson<{ username: string }>(`/api/auth/${mode}`, parsed.data);
    setPending(false);

    if (!response.ok) {
      if (response.error.issues) {
        setErrors(
          Object.fromEntries(Object.entries(response.error.issues).map(([k, v]) => [k, issue(v)])),
        );
      } else {
        setFormError(apiError(response.error.code));
      }
      if (response.error.code === 'emailTaken') setErrors({ email: apiError('emailTaken') });
      if (response.error.code === 'usernameTaken')
        setErrors({ username: apiError('usernameTaken') });
      return;
    }

    toast.success(t('success', { username: response.data.username }));
    router.push(isSafePath(next) ? next : '/');
    router.refresh();
  }

  const field = (name: 'email' | 'username' | 'password') => ({
    id: `auth-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `auth-${name}-error` : undefined,
    value: values[name],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [name]: event.target.value })),
  });

  const otherHref = mode === 'login' ? '/register' : '/login';

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="font-mono text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>

      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        <Field id="auth-email" label={tFields('email')} error={errors.email}>
          <Input
            {...field('email')}
            type="email"
            autoComplete="email"
            placeholder={tFields('emailPlaceholder')}
          />
        </Field>
        {mode === 'register' && (
          <Field id="auth-username" label={tFields('username')} error={errors.username}>
            <Input
              {...field('username')}
              autoComplete="username"
              placeholder={tFields('usernamePlaceholder')}
            />
          </Field>
        )}
        <Field id="auth-password" label={tFields('password')} error={errors.password}>
          <Input
            {...field('password')}
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </Field>

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t('pending') : t('submit')}
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted">
        {t('switchPrompt')}{' '}
        <Link href={otherHref} className="text-accent underline-offset-4 hover:underline">
          {t('switchLink')}
        </Link>
      </p>
    </Card>
  );
}

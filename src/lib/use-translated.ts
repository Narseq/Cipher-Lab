'use client';

import { useTranslations } from 'next-intl';
import type en from '../../messages/en.json';
import type { ApiErrorCode } from '@/lib/api-types';
import type { Cipher, CipherError, CipherOptions } from '@/lib/ciphers';

type ValidationKey = keyof typeof en.validation;

/** Translators for the dynamic keys the backend and the cipher registry hand out. */
export function useTranslated() {
  const t = useTranslations();
  const validation = useTranslations('validation');
  const apiErrors = useTranslations('errors.api');
  const cipherErrors = useTranslations('errors.cipher');

  return {
    /** Message for a field issue key returned by the API or a Zod schema. */
    issue: (key: string) => {
      const known = key as ValidationKey;
      return validation.has(known) ? validation(known) : validation('invalid');
    },
    apiError: (code: ApiErrorCode) => apiErrors(code),
    cipherError: (error: CipherError) =>
      cipherErrors(error.code, { char: error.values.char ?? '' }),
    /** `cipher.description` is a message key, e.g. "ciphers.caesar.description". */
    cipherDescription: (cipher: Cipher) => t(cipher.description as never),
    optionLabel: (name: string) => t(`ciphers.options.${name}` as never),
    badgeName: (code: string) => t(`badges.${code}.name` as never),
    badgeDescription: (code: string) => t(`badges.${code}.description` as never),
    /** "Shift: 3" style summary of the options used. */
    optionsSummary: (options: CipherOptions) =>
      Object.entries(options)
        .map(([name, value]) => `${t(`ciphers.options.${name}` as never)}: ${value}`)
        .join(', '),
  };
}

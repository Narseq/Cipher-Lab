'use client';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Cipher, CipherOptions } from '@/lib/ciphers';
import { useTranslated } from '@/lib/use-translated';

export type OptionValues = Record<string, string>;

export function defaultOptionValues(cipher: Cipher): OptionValues {
  return Object.fromEntries(cipher.options.map((field) => [field.name, String(field.default)]));
}

/** Converts the text typed into the fields to typed options (numbers for number fields). */
export function toCipherOptions(cipher: Cipher, values: OptionValues): CipherOptions {
  return Object.fromEntries(
    cipher.options.map((field) => {
      const raw = values[field.name] ?? '';
      return [field.name, field.type === 'number' ? Number(raw) : raw];
    }),
  );
}

interface CipherOptionsFieldsProps {
  cipher: Cipher;
  values: OptionValues;
  onChange: (values: OptionValues) => void;
  idPrefix: string;
  error?: string;
}

export function CipherOptionsFields({
  cipher,
  values,
  onChange,
  idPrefix,
  error,
}: CipherOptionsFieldsProps) {
  const { optionLabel } = useTranslated();

  return (
    <>
      {cipher.options.map((field) => {
        const id = `${idPrefix}-${field.name}`;
        return (
          <Field key={field.name} id={id} label={optionLabel(field.name)} error={error}>
            <Input
              id={id}
              type={field.type === 'number' ? 'number' : 'text'}
              value={values[field.name] ?? ''}
              min={field.type === 'number' ? field.min : undefined}
              max={field.type === 'number' ? field.max : undefined}
              maxLength={field.type === 'text' ? field.maxLength : undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => onChange({ ...values, [field.name]: event.target.value })}
            />
          </Field>
        );
      })}
    </>
  );
}

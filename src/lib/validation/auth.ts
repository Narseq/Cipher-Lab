import { z } from 'zod';

// Messages are keys under `validation.*` in the translation files.
export const registerSchema = z.object({
  email: z.email('emailInvalid').max(254, 'emailInvalid'),
  username: z
    .string('usernameInvalid')
    .regex(/^[a-z0-9_]{3,20}$/i, 'usernameInvalid')
    .toLowerCase(),
  password: z.string('passwordTooShort').min(8, 'passwordTooShort').max(72, 'passwordTooLong'),
});

export const loginSchema = z.object({
  email: z.email('emailInvalid'),
  password: z.string('required').min(1, 'required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

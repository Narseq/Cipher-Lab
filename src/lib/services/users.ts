import bcrypt from 'bcryptjs';
import { ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import type { LoginInput, RegisterInput } from '@/lib/validation/auth';

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so both failures take the same time.
const DUMMY_HASH = bcrypt.hashSync('cipher-lab-dummy', 4);

export async function registerUser({ email, username, password }: RegisterInput) {
  const normalizedEmail = email.toLowerCase();
  const [emailOwner, usernameOwner] = await Promise.all([
    db.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
    db.user.findUnique({ where: { username }, select: { id: true } }),
  ]);
  if (emailOwner) throw new ApiError('emailTaken');
  if (usernameOwner) throw new ApiError('usernameTaken');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return db.user.create({
    data: { email: normalizedEmail, username, passwordHash },
    select: { id: true, username: true, email: true },
  });
}

export async function verifyLogin({ email, password }: LoginInput) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !matches) throw new ApiError('invalidCredentials');
  return { id: user.id, username: user.username, email: user.email };
}

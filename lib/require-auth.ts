import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth-session';
import { getUserRole } from '@/lib/db';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function requireAuth(): Promise<{ email: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    throw new UnauthorizedError();
  }

  const session = verifySessionToken(token);
  if (!session) {
    throw new UnauthorizedError();
  }

  return { email: session.email };
}

export async function requireAdmin(): Promise<{ email: string }> {
  const session = await requireAuth();
  const role = getUserRole(session.email);
  if (role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  return session;
}

export function deterministicUserIdFromEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  const bytes = createHash('sha256').update(normalized).digest().subarray(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

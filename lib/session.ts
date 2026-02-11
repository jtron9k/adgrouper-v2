import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'app_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
    || (process.env.NODE_ENV === 'development' ? 'dev-session-secret-min-32-chars' : undefined);
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters');
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function verify(payload: string, signature: string): boolean {
  try {
    const expected = sign(payload);
    return crypto.timingSafeEqual(Buffer.from(signature, 'base64url'), Buffer.from(expected, 'base64url'));
  } catch {
    return false;
  }
}

export interface Session {
  email: string;
  exp: number;
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(SESSION_COOKIE)?.value;
    if (!value) return null;

    const [payloadB64, signature] = value.split('.');
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    if (!verify(payload, signature)) return null;

    const data = JSON.parse(payload) as Session;
    if (data.exp < Date.now() / 1000) return null;
    if (!data.email || typeof data.email !== 'string') return null;

    return data;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, email: string): void {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = JSON.stringify({ email: email.toLowerCase().trim(), exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = sign(payload);
  const value = `${payloadB64}.${signature}`;

  response.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
}

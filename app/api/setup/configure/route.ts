import { NextRequest, NextResponse } from 'next/server';
import { getApprovedEmailCount, addApprovedEmail, upsertApiKey, getDb } from '@/lib/db';
import type { ApiKeyType } from '@/lib/api-keys';

export async function POST(request: NextRequest) {
  // Guard: already configured
  if (getApprovedEmailCount() > 0) {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 403 });
  }

  const body = await request.json();
  const { emails, apiKeys } = body as {
    emails?: string[];
    apiKeys?: { openai?: string; gemini?: string; claude?: string };
  };

  // Validate emails
  const validEmails = (emails ?? [])
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.includes('@'));

  if (validEmails.length === 0) {
    return NextResponse.json({ error: 'At least one valid email is required' }, { status: 400 });
  }

  // Validate API keys — at least one must be non-empty
  const keyEntries: Array<[ApiKeyType, string]> = (
    [
      ['openai', apiKeys?.openai],
      ['gemini', apiKeys?.gemini],
      ['claude', apiKeys?.claude],
    ] as Array<[ApiKeyType, string | undefined]>
  )
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([k, v]) => [k, v!.trim()]);

  if (keyEntries.length === 0) {
    return NextResponse.json(
      { error: 'At least one LLM API key is required' },
      { status: 400 }
    );
  }

  // Write atomically in a single transaction
  const db = getDb();
  const writeAll = db.transaction(() => {
    validEmails.forEach((email, i) => addApprovedEmail(email, i === 0 ? 'admin' : 'user'));
    for (const [keyType, value] of keyEntries) {
      upsertApiKey(keyType, value);
    }
  });
  writeAll();

  return NextResponse.json({ ok: true });
}

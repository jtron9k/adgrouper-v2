import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/require-auth';
import { upsertApiKey } from '@/lib/db';
import type { ApiKeyType } from '@/lib/api-keys';

// POST /api/admin/api-keys - Upsert one or more API keys (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { openai, gemini, claude } = body as {
      openai?: string;
      gemini?: string;
      claude?: string;
    };

    const entries: Array<[ApiKeyType, string]> = (
      [
        ['openai', openai],
        ['gemini', gemini],
        ['claude', claude],
      ] as Array<[ApiKeyType, string | undefined]>
    )
      .filter(([, v]) => v && v.trim().length > 0)
      .map(([k, v]) => [k, v!.trim()]);

    for (const [keyType, value] of entries) {
      upsertApiKey(keyType, value);
    }

    return NextResponse.json({ ok: true, updated: entries.map(([k]) => k) });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/require-auth';
import { getAllStoredDefaultPrompts, setDefaultPrompt } from '@/lib/db';
import { defaultPrompts } from '@/lib/prompts';

const PROMPT_TYPES = ['extraction', 'keywordGrouping', 'adCopy', 'keywordSuggestion'] as const;

// GET /api/admin/prompts - Returns current defaults (any authenticated user)
export async function GET() {
  try {
    await requireAuth();

    const stored = getAllStoredDefaultPrompts();
    const map = Object.fromEntries(stored.map((r) => [r.prompt_type, r.prompt_text]));

    return NextResponse.json({
      extraction:        map.extraction        ?? defaultPrompts.extraction,
      keywordGrouping:   map.keywordGrouping   ?? defaultPrompts.keywordGrouping,
      adCopy:            map.adCopy            ?? defaultPrompts.adCopy,
      keywordSuggestion: map.keywordSuggestion ?? defaultPrompts.keywordSuggestion,
    });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/prompts - Bulk-update provided prompt types (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json() as Record<string, string | undefined>;

    for (const type of PROMPT_TYPES) {
      const value = body[type];
      if (value?.trim()) {
        setDefaultPrompt(type, value.trim());
      }
    }

    return NextResponse.json({ ok: true });
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

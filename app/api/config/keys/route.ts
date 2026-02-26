import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, UnauthorizedError } from '@/lib/require-auth';
import { getAllApiKeyPresence } from '@/lib/api-keys';

/**
 * API route to report which API keys are configured.
 * Returns presence booleans only — never exposes key values.
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAuth();
    return NextResponse.json(getAllApiKeyPresence());
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'An error occurred while checking API keys' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { UnauthorizedError, requireAuth } from '@/lib/require-auth';

export async function GET() {
  try {
    const session = await requireAuth();
    return NextResponse.json({
      authenticated: true,
      email: session.email,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}

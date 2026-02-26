import { NextResponse } from 'next/server';
import { UnauthorizedError, requireAuth } from '@/lib/require-auth';
import { getUserRole } from '@/lib/db';

export async function GET() {
  try {
    const session = await requireAuth();
    return NextResponse.json({
      authenticated: true,
      email: session.email,
      role: getUserRole(session.email),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}

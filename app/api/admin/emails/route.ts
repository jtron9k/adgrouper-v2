import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/require-auth';
import { getAllApprovedEmails, addApprovedEmail, isEmailApproved } from '@/lib/db';

// GET /api/admin/emails - List all approved emails with roles
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ emails: getAllApprovedEmails() });
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

// POST /api/admin/emails - Add a new approved email
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const email = (body.email ?? '').trim().toLowerCase();
    const role: 'admin' | 'user' = body.role === 'admin' ? 'admin' : 'user';

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (isEmailApproved(email)) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    addApprovedEmail(email, role);
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

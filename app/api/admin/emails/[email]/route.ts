import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/require-auth';
import { setUserRole, removeApprovedEmail, getAllApprovedEmails } from '@/lib/db';

// PATCH /api/admin/emails/[email] - Update role for an email
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const session = await requireAdmin();
    const { email } = await params;
    const targetEmail = decodeURIComponent(email).trim().toLowerCase();

    const body = await request.json();
    const role: 'admin' | 'user' = body.role === 'admin' ? 'admin' : 'user';

    // Guard: cannot demote own admin role
    if (targetEmail === session.email && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 });
    }

    setUserRole(targetEmail, role);
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

// DELETE /api/admin/emails/[email] - Remove an approved email
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const session = await requireAdmin();
    const { email } = await params;
    const targetEmail = decodeURIComponent(email).trim().toLowerCase();

    // Guard: cannot delete own account
    if (targetEmail === session.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Guard: cannot delete the last admin
    const all = getAllApprovedEmails();
    const admins = all.filter(e => e.role === 'admin');
    const targetIsAdmin = admins.some(e => e.email === targetEmail);
    if (targetIsAdmin && admins.length === 1) {
      return NextResponse.json({ error: 'Cannot delete the last admin' }, { status: 400 });
    }

    removeApprovedEmail(targetEmail);
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

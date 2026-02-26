import { NextRequest, NextResponse } from 'next/server';
import { Campaign } from '@/types';
import { requireAuth, UnauthorizedError, deterministicUserIdFromEmail } from '@/lib/require-auth';
import { getRunById, updateRunStage, addSnapshot, deleteRun, getUserRole } from '@/lib/db';

// GET /api/runs/[id] - Get a specific run with its snapshots
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const run = getRunById(id);

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Deserialize snapshot data (stored as JSON strings in SQLite)
    const serialized = {
      ...run,
      snapshots: run.snapshots.map((s) => ({
        ...s,
        data: JSON.parse(s.data),
      })),
    };

    return NextResponse.json({ run: serialized });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/runs/[id] - Update run stage and/or add a new snapshot
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const run = getRunById(id);
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const role = getUserRole(session.email);
    if (role !== 'admin' && run.user_id !== deterministicUserIdFromEmail(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await _request.json();
    const { stage, data } = body as {
      stage?: 'submitted' | 'results';
      data?: Campaign;
    };

    if (stage) {
      updateRunStage(id, stage);
    }

    if (data) {
      addSnapshot({ runId: id, stage: stage || 'results', data });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/runs/[id] - Delete a run and its snapshots
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const run = getRunById(id);
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const role = getUserRole(session.email);
    if (role !== 'admin' && run.user_id !== deterministicUserIdFromEmail(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    deleteRun(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

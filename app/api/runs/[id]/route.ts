import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Campaign } from '@/types';
import { requireAuth, UnauthorizedError } from '@/lib/require-auth';

// GET /api/runs/[id] - Get a specific run with its snapshots
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: run, error } = await supabase
      .from('runs')
      .select(`
        *,
        snapshots (
          id,
          stage,
          data,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    return NextResponse.json({ run });
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
    await requireAuth();
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const body = await _request.json();
    const { stage, data } = body as {
      stage?: 'submitted' | 'results';
      data?: Campaign;
    };

    // Update the run stage if provided
    if (stage) {
      const { error: updateError } = await supabase
        .from('runs')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Add a new snapshot if data is provided
    if (data) {
      const { error: snapshotError } = await supabase
        .from('snapshots')
        .insert({
          run_id: id,
          stage: stage || 'results',
          data,
        });

      if (snapshotError) {
        return NextResponse.json({ error: snapshotError.message }, { status: 500 });
      }
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
    await requireAuth();
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Snapshots will be deleted automatically due to ON DELETE CASCADE
    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}








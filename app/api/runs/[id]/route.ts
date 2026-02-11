import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { getSession } from '@/lib/session';
import { Campaign } from '@/types';

// GET /api/runs/[id] - Get a specific run with its snapshots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }>
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminSupabaseClient();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/runs/[id] - Update run stage and/or add a new snapshot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const body = await request.json();
    const { stage, data } = body as {
      stage?: 'submitted' | 'results';
      data?: Campaign;
    };

    if (stage) {
      const { error: updateError } = await supabase
        .from('runs')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/runs/[id] - Delete a run and its snapshots
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

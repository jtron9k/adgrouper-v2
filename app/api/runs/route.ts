import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { getSession } from '@/lib/session';
import { Campaign } from '@/types';

// GET /api/runs - List all runs
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: runs, error } = await supabase
      .from('runs')
      .select(`
        *,
        snapshots (
          id,
          stage,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ runs: runs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/runs - Create a new run with initial snapshot
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const body = await request.json();
    const { campaignName, campaignGoal, stage, data } = body as {
      campaignName: string;
      campaignGoal: string;
      stage: 'submitted' | 'results';
      data: Campaign;
    };

    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        user_id: null,
        user_email: session.email,
        campaign_name: campaignName,
        campaign_goal: campaignGoal,
        stage,
      })
      .select()
      .single();

    if (runError) {
      return NextResponse.json({ error: runError.message }, { status: 500 });
    }

    const { error: snapshotError } = await supabase
      .from('snapshots')
      .insert({
        run_id: run.id,
        stage,
        data,
      });

    if (snapshotError) {
      await supabase.from('runs').delete().eq('id', run.id);
      return NextResponse.json({ error: snapshotError.message }, { status: 500 });
    }

    return NextResponse.json({ run });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Campaign } from '@/types';

// GET /api/runs - List all runs from all users
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all runs with snapshots (no user_id filter)
    // Note: RLS policies may need to be updated to allow all authenticated users to see all runs
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

    // user_email is now stored in the table, return runs directly
    return NextResponse.json({ runs: runs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/runs - Create a new run with initial snapshot
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignName, campaignGoal, stage, data } = body as {
      campaignName: string;
      campaignGoal: string;
      stage: 'submitted' | 'results';
      data: Campaign;
    };

    // Create the run
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        campaign_name: campaignName,
        campaign_goal: campaignGoal,
        stage,
      })
      .select()
      .single();

    if (runError) {
      return NextResponse.json({ error: runError.message }, { status: 500 });
    }

    // Create the initial snapshot
    const { error: snapshotError } = await supabase
      .from('snapshots')
      .insert({
        run_id: run.id,
        stage,
        data,
      });

    if (snapshotError) {
      // Rollback the run if snapshot creation fails
      await supabase.from('runs').delete().eq('id', run.id);
      return NextResponse.json({ error: snapshotError.message }, { status: 500 });
    }

    return NextResponse.json({ run });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}










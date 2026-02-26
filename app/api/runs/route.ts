import { NextRequest, NextResponse } from 'next/server';
import { Campaign } from '@/types';
import {
  deterministicUserIdFromEmail,
  requireAuth,
  UnauthorizedError,
} from '@/lib/require-auth';
import { getAllRuns, createRun, getRunsByUserId, getUserRole } from '@/lib/db';

// GET /api/runs - List runs (all for admin, own for users)
export async function GET() {
  try {
    const session = await requireAuth();
    const role = getUserRole(session.email);
    const runs =
      role === 'admin'
        ? getAllRuns()
        : getRunsByUserId(deterministicUserIdFromEmail(session.email));
    return NextResponse.json({ runs });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/runs - Create a new run with initial snapshot
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { campaignName, campaignGoal, stage, data } = body as {
      campaignName: string;
      campaignGoal: string;
      stage: 'submitted' | 'results';
      data: Campaign;
    };

    const run = createRun({
      userId: deterministicUserIdFromEmail(session.email),
      userEmail: session.email,
      campaignName,
      campaignGoal,
      stage,
      data,
    });

    return NextResponse.json({ run });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Signup is disabled - accounts must be created manually
  return NextResponse.json(
    { error: 'Account creation is not available. Please contact an administrator for access.' },
    { status: 403 }
  );
}


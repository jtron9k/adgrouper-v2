import { NextResponse } from 'next/server';
import { getApprovedEmailCount } from '@/lib/db';

export async function GET() {
  const count = getApprovedEmailCount();
  return NextResponse.json({ needsSetup: count === 0 });
}

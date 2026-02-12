import { NextRequest, NextResponse } from 'next/server';
import { generateExcelFile } from '@/lib/excel';
import { Campaign } from '@/types';
import { requireAuth, UnauthorizedError } from '@/lib/require-auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const campaign = await request.json();

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign data is required' },
        { status: 400 }
      );
    }

    const buffer = generateExcelFile(campaign as Campaign);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${(campaign as Campaign).name || 'campaign'}.xlsx"`,
      },
    });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
}

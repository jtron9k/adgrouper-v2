import { NextRequest, NextResponse } from 'next/server';
import { generateExcelFile } from '@/lib/excel';
import { Campaign } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const campaign = await request.json();

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign data is required' },
        { status: 400 }
      );
    }

    const buffer = generateExcelFile(campaign as Campaign);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${(campaign as Campaign).name || 'campaign'}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
}


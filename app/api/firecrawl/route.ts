import { NextRequest, NextResponse } from 'next/server';
import { extractMultipleLandingPages } from '@/lib/firecrawl';

export async function POST(request: NextRequest) {
  try {
    const { urls, apiKey, extractionPrompt } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Firecrawl API key is required' },
        { status: 400 }
      );
    }

    if (!extractionPrompt) {
      return NextResponse.json(
        { error: 'Extraction prompt is required' },
        { status: 400 }
      );
    }

    const results = await extractMultipleLandingPages(
      urls,
      apiKey,
      extractionPrompt
    );

    return NextResponse.json({ data: results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to extract landing pages' },
      { status: 500 }
    );
  }
}


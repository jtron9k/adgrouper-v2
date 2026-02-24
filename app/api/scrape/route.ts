import { NextRequest, NextResponse } from 'next/server';
import { scrapeAndExtractMultipleLandingPages } from '@/lib/scraper';
import { AIProvider } from '@/types';
import { getApiKey } from '@/lib/api-keys';
import { requireAuth, UnauthorizedError } from '@/lib/require-auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { urls, extractionPrompt, provider } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }

    if (!extractionPrompt) {
      return NextResponse.json(
        { error: 'Extraction prompt is required' },
        { status: 400 }
      );
    }

    if (!provider || !provider.name || !provider.model) {
      return NextResponse.json(
        { error: 'Invalid provider structure. Provider must have name and model.' },
        { status: 400 }
      );
    }

    // Fetch AI provider key from Supabase
    const aiProviderKey = await getApiKey(provider.name as 'openai' | 'gemini' | 'claude');

    const validatedProvider: AIProvider = {
      name: provider.name,
      apiKey: aiProviderKey,
      model: provider.model,
    };

    const results = await scrapeAndExtractMultipleLandingPages(
      urls,
      extractionPrompt,
      validatedProvider
    );

    return NextResponse.json({ data: results });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to extract landing pages' },
      { status: 500 }
    );
  }
}

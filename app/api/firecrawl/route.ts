import { NextRequest, NextResponse } from 'next/server';
import { extractMultipleLandingPages, scrapeAndExtractMultipleLandingPages } from '@/lib/firecrawl';
import { AIProvider } from '@/types';
import { getApiKey } from '@/lib/api-keys';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Fetch firecrawl key from Supabase
    const firecrawlKey = await getApiKey('firecrawl');

    // If provider is provided, use the new scrape + LLM approach
    // Otherwise, fall back to the existing extract endpoint for backward compatibility
    let results;
    if (provider) {
      // Validate provider structure
      if (!provider.name || !provider.model) {
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

      results = await scrapeAndExtractMultipleLandingPages(
        urls,
        firecrawlKey,
        extractionPrompt,
        validatedProvider
      );
    } else {
      // Fallback to existing extract endpoint
      results = await extractMultipleLandingPages(
        urls,
        firecrawlKey,
        extractionPrompt
      );
    }

    return NextResponse.json({ data: results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to extract landing pages' },
      { status: 500 }
    );
  }
}





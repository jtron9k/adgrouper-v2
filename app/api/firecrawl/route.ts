import { NextRequest, NextResponse } from 'next/server';
import { extractMultipleLandingPages, scrapeAndExtractMultipleLandingPages } from '@/lib/firecrawl';
import { AIProvider } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { urls, apiKey, extractionPrompt, provider } = await request.json();

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

    // If provider is provided, use the new scrape + LLM approach
    // Otherwise, fall back to the existing extract endpoint for backward compatibility
    let results;
    if (provider) {
      // Validate provider structure
      if (!provider.name || !provider.apiKey || !provider.model) {
        return NextResponse.json(
          { error: 'Invalid provider structure. Provider must have name, apiKey, and model.' },
          { status: 400 }
        );
      }

      const validatedProvider: AIProvider = {
        name: provider.name,
        apiKey: provider.apiKey,
        model: provider.model,
      };

      results = await scrapeAndExtractMultipleLandingPages(
        urls,
        apiKey,
        extractionPrompt,
        validatedProvider
      );
    } else {
      // Fallback to existing extract endpoint
      results = await extractMultipleLandingPages(
        urls,
        apiKey,
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





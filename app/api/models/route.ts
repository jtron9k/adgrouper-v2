import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIModels, getGeminiModels, getClaudeModels } from '@/lib/providers';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    let models: string[];

    switch (provider) {
      case 'openai':
        models = await getOpenAIModels(apiKey);
        break;
      case 'gemini':
        models = await getGeminiModels(apiKey);
        break;
      case 'claude':
        models = getClaudeModels();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid provider' },
          { status: 400 }
        );
    }

    return NextResponse.json({ models });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}


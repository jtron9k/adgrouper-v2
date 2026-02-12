import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIModels, getGeminiModels, getClaudeModels } from '@/lib/providers';
import { getApiKey } from '@/lib/api-keys';
import { requireAuth, UnauthorizedError } from '@/lib/require-auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    let models: string[];

    switch (provider) {
      case 'openai':
        const openaiKey = await getApiKey('openai');
        models = await getOpenAIModels(openaiKey);
        break;
      case 'gemini':
        const geminiKey = await getApiKey('gemini');
        models = await getGeminiModels(geminiKey);
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
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}












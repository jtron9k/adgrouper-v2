import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/providers';
import { formatPrompt, formatLandingPagesForPrompt, defaultPrompts } from '@/lib/prompts';
import { AIProvider, LandingPageData } from '@/types';
import { getApiKey } from '@/lib/api-keys';
import { requireAuth, UnauthorizedError } from '@/lib/require-auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const {
      adgroupData,
      landingPageData,
      campaignGoal,
      adCopyPrompt,
      provider,
    } = await request.json();

    if (!adgroupData || !provider || !provider.name || !provider.model) {
      return NextResponse.json(
        { error: 'Adgroup data and provider with name and model are required' },
        { status: 400 }
      );
    }

    const apiKey = getApiKey(provider.name as 'openai' | 'gemini' | 'claude');
    
    // Construct AIProvider with fetched key
    const aiProvider: AIProvider = {
      name: provider.name,
      apiKey: apiKey,
      model: provider.model,
    };

    const prompt = formatPrompt(adCopyPrompt || defaultPrompts.adCopy, {
      campaignGoal: campaignGoal || '',
      adgroupTheme: adgroupData.name || '',
      keywords: adgroupData.keywords?.map((k: any) => k.text || k).join(', ') || '',
      landingPageData: formatLandingPagesForPrompt((landingPageData || []) as LandingPageData[]),
    });

    const response = await callLLM(aiProvider, prompt);
    
    // Parse JSON response
    let parsed;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch (parseError) {
      // Don't expose LLM response in error message for security
      return NextResponse.json(
        { error: 'Failed to parse ad copy response. Please try again.' },
        { status: 500 }
      );
    }

    // Ensure character limits
    const headlines = (parsed.headlines || [])
      .map((h: string) => h.slice(0, 30))
      .slice(0, 6);
    
    const descriptions = (parsed.descriptions || [])
      .map((d: string) => d.slice(0, 90))
      .slice(0, 3);

    // Pad arrays if needed
    while (headlines.length < 6) headlines.push('');
    while (descriptions.length < 3) descriptions.push('');

    return NextResponse.json({
      headlines,
      descriptions,
    });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate ad copy' },
      { status: 500 }
    );
  }
}




import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/providers';
import { formatPrompt, formatLandingPagesForPrompt, defaultPrompts } from '@/lib/prompts';
import { AIProvider, LandingPageData } from '@/types';
import { getApiKey } from '@/lib/api-keys';

export async function POST(request: NextRequest) {
  try {
    const {
      adgroupTheme,
      existingKeywords,
      landingPageData,
      campaignGoal,
      suggestionPrompt,
      provider,
    } = await request.json();

    if (!adgroupTheme || !existingKeywords || !provider || !provider.name || !provider.model) {
      return NextResponse.json(
        { error: 'Adgroup theme, existing keywords, and provider with name and model are required' },
        { status: 400 }
      );
    }

    // Fetch API key from Supabase based on provider name
    const apiKey = await getApiKey(provider.name as 'openai' | 'gemini' | 'claude');
    
    // Construct AIProvider with fetched key
    const aiProvider: AIProvider = {
      name: provider.name,
      apiKey: apiKey,
      model: provider.model,
    };

    const prompt = formatPrompt(suggestionPrompt || defaultPrompts.keywordSuggestion, {
      adgroupTheme,
      existingKeywords: Array.isArray(existingKeywords) 
        ? existingKeywords.join(', ') 
        : existingKeywords,
      landingPageData: formatLandingPagesForPrompt((landingPageData || []) as LandingPageData[]),
      campaignGoal: campaignGoal || '',
    });

    const response = await callLLM(aiProvider, prompt);
    
    // Parse JSON response
    let keywords: string[];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      } else {
        // Try to parse as plain text, split by commas or newlines
        keywords = response
          .split(/[,\n]/)
          .map(k => k.trim().replace(/^["']|["']$/g, ''))
          .filter(k => k.length > 0);
      }
    } catch (parseError) {
      // Fallback: split by commas or newlines
      keywords = response
        .split(/[,\n]/)
        .map(k => k.trim().replace(/^["']|["']$/g, ''))
        .filter(k => k.length > 0);
    }

    return NextResponse.json({ keywords: keywords.slice(0, 10) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to suggest keywords' },
      { status: 500 }
    );
  }
}













import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/providers';
import { formatPrompt, formatLandingPagesForPrompt, defaultPrompts } from '@/lib/prompts';
import { AIProvider, LandingPageData } from '@/types';
import { getApiKey } from '@/lib/api-keys';
import { requireAuth, UnauthorizedError } from '@/lib/require-auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { keywords, landingPageData, campaignGoal, groupingPrompt, provider } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    if (!landingPageData || !Array.isArray(landingPageData)) {
      return NextResponse.json(
        { error: 'Landing page data is required' },
        { status: 400 }
      );
    }

    if (!campaignGoal) {
      return NextResponse.json(
        { error: 'Campaign goal is required' },
        { status: 400 }
      );
    }

    if (!provider || !provider.name || !provider.model) {
      return NextResponse.json(
        { error: 'AI provider with name and model is required' },
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

    const prompt = formatPrompt(groupingPrompt || defaultPrompts.keywordGrouping, {
      campaignGoal,
      landingPages: formatLandingPagesForPrompt(landingPageData as LandingPageData[]),
      keywords: keywords.join(', '),
    });

    const response = await callLLM(aiProvider, prompt);
    
    // Parse JSON response
    let parsed;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, try to extract JSON object directly
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse LLM response as JSON');
      }
    }

    // Generate IDs for adgroups and associate landing page data
    // Handle both singular landingPageUrl and plural landingPageUrls for compatibility
    const adgroups = parsed.adgroups.map((ag: any, index: number) => {
      // Prioritize singular landingPageUrl, fall back to landingPageUrls array
      let urls: string[] = [];
      if (ag.landingPageUrl) {
        urls = [ag.landingPageUrl];
      } else if (ag.landingPageUrls && Array.isArray(ag.landingPageUrls)) {
        urls = ag.landingPageUrls.slice(0, 1); // Only take the first one
      }

      return {
        id: `adgroup-${index + 1}`,
        name: ag.name,
        keywords: ag.keywords.map((k: string) => ({ text: k, removed: false })),
        landingPageUrls: urls,
        landingPageData: (landingPageData as LandingPageData[]).filter(
          (lp) => urls.includes(lp.url)
        ),
        headlines: [],
        descriptions: [],
      };
    });

    return NextResponse.json({
      adgroups,
      irrelevantKeywords: parsed.irrelevantKeywords || [],
    });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to group keywords' },
      { status: 500 }
    );
  }
}

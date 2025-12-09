import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/providers';
import { formatPrompt, formatLandingPagesForPrompt, defaultPrompts } from '@/lib/prompts';
import { AIProvider, LandingPageData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const {
      adgroupData,
      landingPageData,
      campaignGoal,
      adCopyPrompt,
      provider,
    } = await request.json();

    if (!adgroupData || !provider) {
      return NextResponse.json(
        { error: 'Adgroup data and provider are required' },
        { status: 400 }
      );
    }

    const prompt = formatPrompt(adCopyPrompt || defaultPrompts.adCopy, {
      campaignGoal: campaignGoal || '',
      adgroupTheme: adgroupData.name || '',
      keywords: adgroupData.keywords?.map((k: any) => k.text || k).join(', ') || '',
      landingPageData: formatLandingPagesForPrompt((landingPageData || []) as LandingPageData[]),
    });

    const response = await callLLM(provider as AIProvider, prompt);
    
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
      return NextResponse.json(
        { error: 'Failed to parse ad copy response. LLM response: ' + response },
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
    return NextResponse.json(
      { error: error.message || 'Failed to generate ad copy' },
      { status: 500 }
    );
  }
}





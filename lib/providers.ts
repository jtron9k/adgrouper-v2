import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from '@/types';

export async function getOpenAIModels(apiKey: string): Promise<string[]> {
  const openai = new OpenAI({ apiKey });
  const models = await openai.models.list();
  return models.data
    .map(model => model.id)
    .filter(id => id.includes('gpt'))
    .sort();
}

export async function getGeminiModels(apiKey: string): Promise<string[]> {
  try {
    // Try to fetch models from Google's API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    
    if (response.ok) {
      const data = await response.json();
      if (data.models && Array.isArray(data.models)) {
        // Filter for models that support generateContent and are not deprecated
        const availableModels = data.models
          .filter((model: any) => 
            model.supportedGenerationMethods?.includes('generateContent') &&
            !model.name.includes('embed') &&
            !model.name.includes('embedding') &&
            model.name.startsWith('models/')
          )
          .map((model: any) => model.name.replace('models/', ''))
          .sort();
        
        if (availableModels.length > 0) {
          return availableModels;
        }
      }
    }
  } catch (error) {
    // If API call fails, fall back to hardcoded list
    console.warn('Failed to fetch Gemini models from API, using hardcoded list:', error);
  }
  
  // Fallback to latest known models (gemini-pro and gemini-pro-vision are deprecated)
  // Order: newest first
  return [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ];
}

export async function getClaudeModels(apiKey: string): Promise<string[]> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.models.list({ limit: 100 });
  return response.data
    .map((model: { id: string }) => model.id)
    .filter((id: string) => id.startsWith('claude-'))
    .sort();
}

export async function callLLM(
  provider: AIProvider,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  switch (provider.name) {
    case 'openai': {
      const openai = new OpenAI({ apiKey: provider.apiKey });
      const response = await openai.chat.completions.create({
        model: provider.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt },
        ],
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || '';
    }

    case 'gemini': {
      const genAI = new GoogleGenerativeAI(provider.apiKey);
      const model = genAI.getGenerativeModel({ model: provider.model });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }

    case 'claude': {
      const anthropic = new Anthropic({ apiKey: provider.apiKey });
      const message = await anthropic.messages.create({
        model: provider.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        ...(systemPrompt ? { system: systemPrompt } : {}),
      });
      return message.content[0].type === 'text' ? message.content[0].text : '';
    }

    default:
      throw new Error(`Unknown provider: ${provider.name}`);
  }
}


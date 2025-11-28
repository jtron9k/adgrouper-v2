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
  // Gemini API doesn't have a models list endpoint, return common models
  return [
    'gemini-pro',
    'gemini-pro-vision',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ];
}

export function getClaudeModels(): string[] {
  // Claude models are hardcoded per requirements
  return [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];
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


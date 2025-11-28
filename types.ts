export interface AIProvider {
  name: 'openai' | 'gemini' | 'claude';
  apiKey: string;
  model: string;
}

export interface FirecrawlConfig {
  apiKey: string;
}

export interface LandingPageData {
  url: string;
  title: string;
  metaDescription: string;
  summary: string;
}

export interface Keyword {
  text: string;
  removed?: boolean;
}

export interface Adgroup {
  id: string;
  name: string;
  keywords: Keyword[];
  landingPageUrls: string[];
  landingPageData: LandingPageData[];
  headlines: string[];
  descriptions: string[];
}

export interface Campaign {
  name: string;
  goal: string;
  provider: AIProvider;
  firecrawlConfig: FirecrawlConfig;
  landingPageUrls: string[];
  keywords: string[];
  adgroups: Adgroup[];
  irrelevantKeywords: string[];
  prompts?: PromptTemplates;
}

export interface PromptTemplates {
  firecrawl: string;
  keywordGrouping: string;
  adCopy: string;
  keywordSuggestion: string;
}

export interface ProgressState {
  step: 'idle' | 'firecrawl' | 'grouping' | 'finalizing';
  message: string;
  current?: number;
  total?: number;
}


export interface AIProvider {
  name: 'openai' | 'gemini' | 'claude';
  apiKey: string;
  model: string;
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
  landingPageUrls: string[];
  keywords: string[];
  adgroups: Adgroup[];
  irrelevantKeywords: string[];
  prompts?: PromptTemplates;
}

export interface PromptTemplates {
  extraction: string;
  keywordGrouping: string;
  adCopy: string;
  keywordSuggestion: string;
}

export interface ProgressState {
  step: 'idle' | 'scraping' | 'grouping' | 'finalizing';
  message: string;
  detail?: string;
  current?: number;
  total?: number;
}

// Run history types
export interface Run {
  id: string;
  user_id: string;
  user_email?: string; // Optional user email for display
  campaign_name: string;
  campaign_goal: string | null;
  stage: 'submitted' | 'results';
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: string;
  run_id: string;
  stage: string;
  data: Campaign;
  created_at: string;
}


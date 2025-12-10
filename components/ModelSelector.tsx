'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AIProvider } from '@/types';
import { getLastUpdated } from '@/lib/version';

interface ModelSelectorProps {
  onSelect: (provider: AIProvider, firecrawlKey: string) => void;
}

const API_KEY_LINKS = {
  openai: 'https://platform.openai.com/docs/quickstart',
  gemini: 'https://aistudio.google.com/welcome',
  claude: 'https://platform.claude.com/docs/en/get-started',
};

export default function ModelSelector({ onSelect }: ModelSelectorProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'claude'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved keys from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem('selectedProvider') as 'openai' | 'gemini' | 'claude' | null;
    const savedApiKey = localStorage.getItem('apiKey') || '';
    const savedFirecrawlKey = localStorage.getItem('firecrawlKey') || '';
    const savedModel = localStorage.getItem('selectedModel') || '';

    if (savedProvider) {
      setProvider(savedProvider);
      setApiKey(savedApiKey);
      setFirecrawlKey(savedFirecrawlKey);
      setSelectedModel(savedModel);
      
      if (savedApiKey && savedProvider === 'claude') {
        // Load Claude models immediately
        loadClaudeModels();
      }
    }
  }, []);

  const loadClaudeModels = () => {
    // Latest Claude models from https://platform.claude.com/docs/en/about-claude/models/overview
    const claudeModels = [
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-5-20251101',
      'claude-opus-4-1-20250805',
    ];
    setModels(claudeModels);
    if (!selectedModel && claudeModels.length > 0) {
      setSelectedModel(claudeModels[0]);
    }
  };

  const handleProviderChange = (newProvider: 'openai' | 'gemini' | 'claude') => {
    setProvider(newProvider);
    setApiKey('');
    setModels([]);
    setSelectedModel('');
    setError('');
    
    if (newProvider === 'claude') {
      loadClaudeModels();
    }
  };

  const fetchModels = async () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch models');
      }

      const data = await response.json();
      setModels(data.models);
      
      if (data.models.length > 0 && !selectedModel) {
        setSelectedModel(data.models[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!apiKey || !firecrawlKey) {
      setError('Please enter both API keys');
      return;
    }

    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    // Save to localStorage
    localStorage.setItem('selectedProvider', provider);
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('firecrawlKey', firecrawlKey);
    localStorage.setItem('selectedModel', selectedModel);

    const aiProvider: AIProvider = {
      name: provider,
      apiKey,
      model: selectedModel,
    };

    onSelect(aiProvider, firecrawlKey);
    router.push('/build');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-500 mb-2">
            Last updated {getLastUpdated()}
          </p>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Google Ads Campaign Builder
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Select your AI provider and configure API keys
          </p>
          <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
            API keys are only stored locally in your browser. Save your keys in a safe spot in case you need them again.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI Provider
            </label>
            <div className="space-y-2">
              {(['openai', 'gemini', 'claude'] as const).map((p) => (
                <label key={p} className="flex items-center text-gray-900 dark:text-gray-100">
                  <input
                    type="radio"
                    name="provider"
                    value={p}
                    checked={provider === p}
                    onChange={() => handleProviderChange(p)}
                    className="mr-2"
                  />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Google' : 'Anthropic'} API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your API key"
            />
            <a
              href={API_KEY_LINKS[provider]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline mt-1 inline-block"
            >
              Don't have an API key? Get one here →
            </a>
            {provider !== 'claude' && (
              <button
                onClick={fetchModels}
                disabled={loading || !apiKey}
                className="mt-2 w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {loading ? 'Loading...' : 'Fetch Models'}
              </button>
            )}
          </div>

          {models.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Firecrawl API Key
            </label>
            <input
              type="password"
              value={firecrawlKey}
              onChange={(e) => setFirecrawlKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your Firecrawl API key"
            />
            <a
              href="https://docs.firecrawl.dev/introduction"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline mt-1 inline-block"
            >
              Get your Firecrawl API key here →
            </a>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!apiKey || !firecrawlKey || !selectedModel}
            className="w-full bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

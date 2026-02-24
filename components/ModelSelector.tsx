'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AIProvider } from '@/types';
import { getLastUpdated } from '@/lib/version';

interface ModelSelectorProps {
  onSelect: (provider: AIProvider) => void;
}

export default function ModelSelector({ onSelect }: ModelSelectorProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'claude'>('openai');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved provider and model from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem('selectedProvider') as 'openai' | 'gemini' | 'claude' | null;
    const savedModel = localStorage.getItem('selectedModel') || '';

    if (savedProvider) {
      setProvider(savedProvider);
      setSelectedModel(savedModel);
      fetchModels(savedProvider);
    } else {
      fetchModels('openai');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProviderChange = (newProvider: 'openai' | 'gemini' | 'claude') => {
    setProvider(newProvider);
    setModels([]);
    setSelectedModel('');
    setError('');
    fetchModels(newProvider);
  };

  const fetchModels = async (providerToFetch?: 'openai' | 'gemini' | 'claude') => {
    const targetProvider = providerToFetch || provider;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: targetProvider }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch models');
      }

      const data = await response.json();
      setModels(data.models);
      
      if (data.models.length > 0) {
        // Set default models based on provider
        let defaultModel = data.models[0]; // Fallback to first model
        
        if (targetProvider === 'gemini') {
          // Default to gemini-pro-latest if available
          const geminiDefault = data.models.find((m: string) => m === 'gemini-pro-latest');
          if (geminiDefault) {
            defaultModel = geminiDefault;
          }
        } else if (targetProvider === 'openai') {
          // Default to gpt-5.1 if available
          const openaiDefault = data.models.find((m: string) => m === 'gpt-5.1');
          if (openaiDefault) {
            defaultModel = openaiDefault;
          }
        } else if (targetProvider === 'claude') {
          // Default to claude-sonnet-4-5 if available
          const claudeDefault = data.models.find((m: string) => m.startsWith('claude-sonnet-4-5'));
          if (claudeDefault) {
            defaultModel = claudeDefault;
          }
        }
        
        // Always set the default when fetching models (user can change it)
        // This ensures defaults are set when switching providers
        setSelectedModel(defaultModel);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    // Save provider and model to localStorage (no API keys)
    localStorage.setItem('selectedProvider', provider);
    localStorage.setItem('selectedModel', selectedModel);

    // Create AIProvider without apiKey (will be fetched server-side)
    const aiProvider: AIProvider = {
      name: provider,
      apiKey: '', // Not used client-side, fetched server-side
      model: selectedModel,
    };

    onSelect(aiProvider);
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
            Search Ads Campaign Builder
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Select your AI provider and model
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

          {models.length === 0 && !loading && !error && (
            <div className="text-center">
              <button
                onClick={() => fetchModels()}
                className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Load Models
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center text-gray-600 dark:text-gray-400">
              Loading models...
            </div>
          )}

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

          <button
            onClick={handleSubmit}
            disabled={!selectedModel}
            className="w-full bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AIProvider, ProgressState, PromptTemplates, LandingPageData } from '@/types';
import PromptEditor from '@/components/PromptEditor';
import ProgressIndicator from '@/components/ProgressIndicator';
import { defaultPrompts } from '@/lib/prompts';
import { validateUrls, validateKeywords, parseCsv } from '@/lib/validation';

export default function BuildPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [urlsText, setUrlsText] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [prompts, setPrompts] = useState<PromptTemplates>(defaultPrompts);
  const [progress, setProgress] = useState<ProgressState>({ step: 'idle', message: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const savedProvider = sessionStorage.getItem('provider');
    const savedFirecrawlKey = sessionStorage.getItem('firecrawlKey');

    if (!savedProvider || !savedFirecrawlKey) {
      router.push('/');
      return;
    }

    setProvider(JSON.parse(savedProvider));
    setFirecrawlKey(savedFirecrawlKey);
  }, [router]);

  const handleFileUpload = (type: 'urls' | 'keywords', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      
      if (type === 'urls') {
        setUrlsText(parsed.join('\n'));
      } else {
        setKeywordsText(parsed.join('\n'));
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validate inputs
    if (!campaignName.trim()) {
      setError('Please enter a campaign name');
      return;
    }

    if (!campaignGoal.trim()) {
      setError('Please enter a campaign goal');
      return;
    }

    const urls = urlsText.split('\n').map(u => u.trim()).filter(u => u);
    const { valid: validUrls, invalid: invalidUrls } = validateUrls(urls);
    
    if (invalidUrls.length > 0) {
      setError(`Invalid URLs: ${invalidUrls.join(', ')}`);
      return;
    }

    if (validUrls.length === 0) {
      setError('Please enter at least one valid landing page URL');
      return;
    }

    if (validUrls.length > 10) {
      setError('Maximum 10 URLs allowed');
      return;
    }

    const keywords = keywordsText.split('\n').map(k => k.trim()).filter(k => k);
    const validKeywords = validateKeywords(keywords);

    if (validKeywords.length === 0) {
      setError('Please enter at least one keyword');
      return;
    }

    try {
      // Step 1: Firecrawl extraction
      setProgress({
        step: 'firecrawl',
        message: 'Crawling landing pages - this may take a minute...',
      });

      const firecrawlResponse = await fetch('/api/firecrawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: validUrls,
          apiKey: firecrawlKey,
          extractionPrompt: prompts.firecrawl,
        }),
      });

      if (!firecrawlResponse.ok) {
        const errorData = await firecrawlResponse.json();
        throw new Error(errorData.error || 'Failed to extract landing pages');
      }

      const firecrawlData = await firecrawlResponse.json();
      const landingPageData: LandingPageData[] = firecrawlData.data;

      // Step 2: Keyword grouping
      setProgress({
        step: 'grouping',
        message: 'Analyzing keywords and creating adgroups...',
      });

      const groupingResponse = await fetch('/api/group-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: validKeywords,
          landingPageData,
          campaignGoal,
          groupingPrompt: prompts.keywordGrouping,
          provider,
        }),
      });

      if (!groupingResponse.ok) {
        const errorData = await groupingResponse.json();
        throw new Error(errorData.error || 'Failed to group keywords');
      }

      const groupingData = await groupingResponse.json();

      // Step 3: Generate ads for each adgroup
      setProgress({
        step: 'finalizing',
        message: 'Generating ad copy...',
      });

      const adgroupsWithAds = await Promise.all(
        groupingData.adgroups.map(async (adgroup: any) => {
          const adsResponse = await fetch('/api/generate-ads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adgroupData: adgroup,
              landingPageData: adgroup.landingPageData,
              campaignGoal,
              adCopyPrompt: prompts.adCopy,
              provider,
            }),
          });

          if (!adsResponse.ok) {
            const errorData = await adsResponse.json();
            console.error(`Failed to generate ads for ${adgroup.name}:`, errorData);
            return {
              ...adgroup,
              headlines: ['', ''],
              descriptions: ['', '', ''],
            };
          }

          const adsData = await adsResponse.json();
          return {
            ...adgroup,
            headlines: adsData.headlines || ['', ''],
            descriptions: adsData.descriptions || ['', '', ''],
          };
        })
      );

      // Store results and navigate
      const campaignData = {
        name: campaignName,
        goal: campaignGoal,
        provider,
        firecrawlConfig: { apiKey: firecrawlKey },
        landingPageUrls: validUrls,
        keywords: validKeywords,
        adgroups: adgroupsWithAds,
        irrelevantKeywords: groupingData.irrelevantKeywords || [],
        prompts,
      };

      sessionStorage.setItem('campaignData', JSON.stringify(campaignData));
      router.push('/results');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setProgress({ step: 'idle', message: '' });
    }
  };

  if (!provider) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ProgressIndicator progress={progress} />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Build Your Campaign</h1>
              <p className="text-sm text-gray-600 mt-1">
                Provider: {provider.name} | Model: {provider.model}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
            >
              Go Back
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Summer Shoe Sale 2025"
                disabled={progress.step !== 'idle'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Goal *
              </label>
              <input
                type="text"
                value={campaignGoal}
                onChange={(e) => setCampaignGoal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Drive sales of our summer shoe lineup for women age 25-44"
                disabled={progress.step !== 'idle'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landing Page URLs (max 10) *
              </label>
              <textarea
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter URLs, one per line (must start with http:// or https://)"
                disabled={progress.step !== 'idle'}
              />
              <div className="mt-2">
                <label className="text-sm text-gray-600">
                  Or upload CSV: 
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('urls', file);
                    }}
                    className="ml-2"
                    disabled={progress.step !== 'idle'}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (max 200) *
              </label>
              <textarea
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter keywords, one per line"
                disabled={progress.step !== 'idle'}
              />
              <div className="mt-2">
                <label className="text-sm text-gray-600">
                  Or upload CSV: 
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('keywords', file);
                    }}
                    className="ml-2"
                    disabled={progress.step !== 'idle'}
                  />
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Prompts (Optional)</h3>
              <PromptEditor
                label="Firecrawl Extraction Prompt"
                value={prompts.firecrawl}
                onChange={(value) => setPrompts({ ...prompts, firecrawl: value })}
              />
              <PromptEditor
                label="Keyword Grouping Prompt"
                value={prompts.keywordGrouping}
                onChange={(value) => setPrompts({ ...prompts, keywordGrouping: value })}
              />
              <PromptEditor
                label="Ad Copy Generation Prompt"
                value={prompts.adCopy}
                onChange={(value) => setPrompts({ ...prompts, adCopy: value })}
              />
              <PromptEditor
                label="Keyword Suggestion Prompt"
                value={prompts.keywordSuggestion}
                onChange={(value) => setPrompts({ ...prompts, keywordSuggestion: value })}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={progress.step !== 'idle'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {progress.step !== 'idle' ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


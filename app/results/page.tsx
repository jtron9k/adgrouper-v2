'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Campaign, Adgroup, Keyword } from '@/types';
import AdgroupCard from '@/components/AdgroupCard';
import KeywordList from '@/components/KeywordList';

export default function ResultsPage() {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedData = sessionStorage.getItem('campaignData');
    if (!savedData) {
      router.push('/');
      return;
    }

    setCampaign(JSON.parse(savedData));
  }, [router]);

  const handleRemoveKeyword = (adgroupIndex: number, keywordIndex: number) => {
    if (!campaign) return;

    const updatedAdgroups = [...campaign.adgroups];
    updatedAdgroups[adgroupIndex].keywords[keywordIndex].removed = true;
    
    setCampaign({
      ...campaign,
      adgroups: updatedAdgroups,
    });
  };

  const handleRemoveIrrelevantKeyword = (index: number) => {
    if (!campaign) return;

    const updated = [...campaign.irrelevantKeywords];
    updated.splice(index, 1);
    
    setCampaign({
      ...campaign,
      irrelevantKeywords: updated,
    });
  };

  const handleGenerateMoreKeywords = async (adgroupIndex: number) => {
    if (!campaign) return;

    const adgroup = campaign.adgroups[adgroupIndex];
    setLoading({ ...loading, [`keywords-${adgroupIndex}`]: true });

    try {
      const response = await fetch('/api/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adgroupTheme: adgroup.name,
          existingKeywords: adgroup.keywords.map(k => k.text),
          landingPageData: adgroup.landingPageData,
          campaignGoal: campaign.goal,
          suggestionPrompt: campaign.prompts?.keywordSuggestion,
          provider: campaign.provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate keywords');
      }

      const data = await response.json();
      const newKeywords: Keyword[] = data.keywords.map((k: string) => ({
        text: k,
        removed: false,
      }));

      const updatedAdgroups = [...campaign.adgroups];
      updatedAdgroups[adgroupIndex].keywords = [
        ...updatedAdgroups[adgroupIndex].keywords,
        ...newKeywords,
      ];

      setCampaign({
        ...campaign,
        adgroups: updatedAdgroups,
      });
    } catch (error) {
      console.error('Error generating keywords:', error);
      alert('Failed to generate keywords. Please try again.');
    } finally {
      setLoading({ ...loading, [`keywords-${adgroupIndex}`]: false });
    }
  };

  const handleRegenerateAds = async (adgroupIndex: number) => {
    if (!campaign) return;

    const adgroup = campaign.adgroups[adgroupIndex];
    setLoading({ ...loading, [`ads-${adgroupIndex}`]: true });

    try {
      const response = await fetch('/api/generate-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adgroupData: adgroup,
          landingPageData: adgroup.landingPageData,
          campaignGoal: campaign.goal,
          adCopyPrompt: campaign.prompts?.adCopy,
          provider: campaign.provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate ads');
      }

      const data = await response.json();

      const updatedAdgroups = [...campaign.adgroups];
      updatedAdgroups[adgroupIndex].headlines = data.headlines || ['', ''];
      updatedAdgroups[adgroupIndex].descriptions = data.descriptions || ['', '', ''];

      setCampaign({
        ...campaign,
        adgroups: updatedAdgroups,
      });
    } catch (error) {
      console.error('Error regenerating ads:', error);
      alert('Failed to regenerate ads. Please try again.');
    } finally {
      setLoading({ ...loading, [`ads-${adgroupIndex}`]: false });
    }
  };

  const handleHeadlineChange = (adgroupIndex: number, headlineIndex: number, value: string) => {
    if (!campaign) return;

    const updatedAdgroups = [...campaign.adgroups];
    updatedAdgroups[adgroupIndex].headlines[headlineIndex] = value;

    setCampaign({
      ...campaign,
      adgroups: updatedAdgroups,
    });
  };

  const handleDescriptionChange = (adgroupIndex: number, descriptionIndex: number, value: string) => {
    if (!campaign) return;

    const updatedAdgroups = [...campaign.adgroups];
    updatedAdgroups[adgroupIndex].descriptions[descriptionIndex] = value;

    setCampaign({
      ...campaign,
      adgroups: updatedAdgroups,
    });
  };

  const handleExport = async () => {
    if (!campaign) return;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });

      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaign.name || 'campaign'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export. Please try again.');
    }
  };

  if (!campaign) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{campaign.goal}</p>
            <p className="text-xs text-gray-500 mt-1">
              Provider: {campaign.provider.name} | Model: {campaign.provider.model}
            </p>
          </div>
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push('/');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
          >
            Start Over
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {campaign.adgroups.map((adgroup, index) => (
            <AdgroupCard
              key={adgroup.id || index}
              adgroup={adgroup}
              onRemoveKeyword={(keywordIndex) => handleRemoveKeyword(index, keywordIndex)}
              onGenerateMoreKeywords={() => handleGenerateMoreKeywords(index)}
              onRegenerateAds={() => handleRegenerateAds(index)}
              onHeadlineChange={(headlineIndex, value) => handleHeadlineChange(index, headlineIndex, value)}
              onDescriptionChange={(descriptionIndex, value) => handleDescriptionChange(index, descriptionIndex, value)}
              loading={loading[`keywords-${index}`] || loading[`ads-${index}`] || false}
            />
          ))}
        </div>

        {campaign.irrelevantKeywords && campaign.irrelevantKeywords.length > 0 && (
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Irrelevant Keywords</h2>
            <KeywordList
              keywords={campaign.irrelevantKeywords.map(k => ({ text: k, removed: false }))}
              onRemove={handleRemoveIrrelevantKeyword}
            />
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white py-3 px-8 rounded-md hover:bg-green-700 font-medium"
          >
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
}


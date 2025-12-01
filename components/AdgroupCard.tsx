'use client';

import { useState } from 'react';
import { Adgroup } from '@/types';
import KeywordList from './KeywordList';
import FirecrawlResults from './FirecrawlResults';
import EditableAdCopy from './EditableAdCopy';

interface AdgroupCardProps {
  adgroup: Adgroup;
  onRemoveKeyword: (keywordIndex: number) => void;
  onGenerateMoreKeywords: () => void;
  onRegenerateAds: () => void;
  onHeadlineChange: (index: number, value: string) => void;
  onDescriptionChange: (index: number, value: string) => void;
  loading?: boolean;
}

export default function AdgroupCard({
  adgroup,
  onRemoveKeyword,
  onGenerateMoreKeywords,
  onRegenerateAds,
  onHeadlineChange,
  onDescriptionChange,
  loading = false,
}: AdgroupCardProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{adgroup.name}</h3>

      <div className="mb-4">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Keywords</h4>
        <KeywordList
          keywords={adgroup.keywords}
          onRemove={onRemoveKeyword}
        />
        <button
          onClick={onGenerateMoreKeywords}
          disabled={loading}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {loading ? 'Generating...' : '+ Generate More Keywords'}
        </button>
      </div>

      <FirecrawlResults landingPageData={adgroup.landingPageData} />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm text-gray-700">Ad Copy</h4>
          <button
            onClick={onRegenerateAds}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            {loading ? 'Regenerating...' : 'Regenerate Ads'}
          </button>
        </div>
        <EditableAdCopy
          headlines={adgroup.headlines}
          descriptions={adgroup.descriptions}
          onHeadlineChange={onHeadlineChange}
          onDescriptionChange={onDescriptionChange}
        />
      </div>
    </div>
  );
}




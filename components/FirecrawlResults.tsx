'use client';

import { useState } from 'react';
import { LandingPageData } from '@/types';

interface FirecrawlResultsProps {
  landingPageData: LandingPageData[];
}

export default function FirecrawlResults({ landingPageData }: FirecrawlResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (landingPageData.length === 0) return null;

  return (
    <div className="border border-gray-300 rounded-md mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-700">Landing Page Analysis</span>
        <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className="p-4 space-y-4">
          {landingPageData.map((data, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">
                <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {data.url}
                </a>
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Title: </span>
                  <span className="text-gray-600">{data.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Meta Description: </span>
                  <span className="text-gray-600">{data.metaDescription}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Summary: </span>
                  <span className="text-gray-600">{data.summary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


'use client';

import { useState } from 'react';
import { LandingPageData } from '@/types';

interface LandingPageResultsProps {
  landingPageData: LandingPageData[];
}

// External link icon component
function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 inline-block ml-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

export default function LandingPageResults({ landingPageData }: LandingPageResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (landingPageData.length === 0) return null;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-md mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-700 dark:text-gray-300">Landing Page Analysis</span>
        <span className="text-gray-500 dark:text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className="p-4 space-y-4">
          {landingPageData.map((data, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {data.url}
                  <ExternalLinkIcon />
                </a>
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Title: </span>
                  <span className="text-gray-600 dark:text-gray-400">{data.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Meta Description: </span>
                  <span className="text-gray-600 dark:text-gray-400">{data.metaDescription}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Summary: </span>
                  <span className="text-gray-600 dark:text-gray-400">{data.summary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

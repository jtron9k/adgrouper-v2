'use client';

import { Keyword } from '@/types';

interface KeywordListProps {
  keywords: Keyword[];
  onRemove: (index: number) => void;
}

export default function KeywordList({ keywords, onRemove }: KeywordListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword, index) => (
        <div
          key={index}
          className="flex items-center bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-1"
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">{keyword.text}</span>
          <button
            onClick={() => onRemove(index)}
            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold"
            title="Remove keyword"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}





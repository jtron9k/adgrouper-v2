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
          className="flex items-center bg-blue-50 border border-blue-200 rounded-md px-3 py-1"
        >
          <span className="text-sm text-gray-700">{keyword.text}</span>
          <button
            onClick={() => onRemove(index)}
            className="ml-2 text-red-600 hover:text-red-800 font-bold"
            title="Remove keyword"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}





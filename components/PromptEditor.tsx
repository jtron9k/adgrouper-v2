'use client';

import { useState } from 'react';

interface PromptEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function PromptEditor({ label, value, onChange }: PromptEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-md mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className="p-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>
      )}
    </div>
  );
}





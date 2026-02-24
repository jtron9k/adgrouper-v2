'use client';

import { ProgressState } from '@/types';

interface ProgressIndicatorProps {
  progress: ProgressState;
}

const stepNumber: Record<string, number> = {
  scraping: 1,
  grouping: 2,
  finalizing: 3,
};

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  if (progress.step === 'idle') return null;

  const step = stepNumber[progress.step] ?? 0;
  const hasProgress = progress.current !== undefined && progress.total !== undefined && progress.total > 0;
  const pct = hasProgress ? Math.round((progress.current! / progress.total!) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {step > 0 && (
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
              Step {step} of 3
            </p>
          )}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {progress.message}
          </h3>
          {progress.detail && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate px-2">
              {progress.detail}
            </p>
          )}
          {hasProgress && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {progress.current} of {progress.total}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

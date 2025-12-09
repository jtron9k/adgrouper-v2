'use client';

import { ProgressState } from '@/types';

interface ProgressIndicatorProps {
  progress: ProgressState;
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  if (progress.step === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {progress.message}
          </h3>
          {progress.current !== undefined && progress.total !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {progress.current} of {progress.total}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}





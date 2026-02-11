'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Run, Snapshot, Campaign } from '@/types';

interface RunWithSnapshots extends Run {
  snapshots: Snapshot[];
}

export default function HistoryPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunWithSnapshots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const response = await fetch('/api/runs');
      if (!response.ok) {
        throw new Error('Failed to load runs');
      }
      const data = await response.json();
      setRuns(data.runs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (run: RunWithSnapshots, targetStage?: 'submitted' | 'results') => {
    try {
      // Get the full run data with snapshots
      const response = await fetch(`/api/runs/${run.id}`);
      if (!response.ok) {
        throw new Error('Failed to load run data');
      }
      
      const { run: fullRun } = await response.json();
      
      // Find the snapshot for the target stage, or use the latest snapshot
      let targetSnapshot: Snapshot | undefined;
      
      if (targetStage) {
        // Find the latest snapshot for the specific stage
        const stageSnapshots = fullRun.snapshots?.filter((s: Snapshot) => s.stage === targetStage) || [];
        targetSnapshot = stageSnapshots.sort(
          (a: Snapshot, b: Snapshot) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      }
      
      // If no target stage specified or not found, use the latest snapshot
      if (!targetSnapshot) {
        targetSnapshot = fullRun.snapshots?.sort(
          (a: Snapshot, b: Snapshot) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      }

      if (!targetSnapshot?.data) {
        throw new Error('No snapshot data found');
      }

      const campaignData = targetSnapshot.data as Campaign;

      // Store in sessionStorage
      sessionStorage.setItem('campaignData', JSON.stringify(campaignData));
      sessionStorage.setItem('currentRunId', run.id);
      
      // Also restore provider for build page (API keys are stored server-side)
      if (campaignData.provider) {
        sessionStorage.setItem('provider', JSON.stringify(campaignData.provider));
      }

      // Navigate based on snapshot stage
      if (targetSnapshot.stage === 'results') {
        router.push('/results');
      } else {
        router.push('/build');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restore run');
    }
  };

  const handleDelete = async (runId: string) => {
    if (!confirm('Are you sure you want to delete this run? This cannot be undone.')) {
      return;
    }

    setDeleting(runId);
    try {
      const response = await fetch(`/api/runs/${runId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete run');
      }

      setRuns(runs.filter(r => r.id !== runId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete run');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'submitted':
        return { text: 'Submitted', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' };
      case 'results':
        return { text: 'Results', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' };
      default:
        return { text: stage, color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campaign History</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and restore all campaign runs from all users
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {runs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No campaign runs yet. Start building a campaign to see history here.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-blue-600 dark:bg-blue-700 text-white py-2 px-6 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 font-medium"
            >
              Build a Campaign
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => {
              const stageLabel = getStageLabel(run.stage);
              const hasSubmittedSnapshot = run.snapshots?.some((s: Snapshot) => s.stage === 'submitted');
              const hasResultsSnapshot = run.snapshots?.some((s: Snapshot) => s.stage === 'results');
              const hasMultipleSnapshots = hasSubmittedSnapshot && hasResultsSnapshot;
              
              return (
                <div
                  key={run.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {run.campaign_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageLabel.color}`}>
                          {stageLabel.text}
                        </span>
                      </div>
                      {run.campaign_goal && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {run.campaign_goal}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        {run.user_email && (
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {run.user_email}
                          </span>
                        )}
                        <span>Created: {formatDate(run.created_at)}</span>
                        {run.updated_at !== run.created_at && (
                          <span>Updated: {formatDate(run.updated_at)}</span>
                        )}
                        {run.snapshots && (
                          <span>{run.snapshots.length} snapshot{run.snapshots.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex items-center gap-2">
                        {hasMultipleSnapshots ? (
                          <>
                            <button
                              onClick={() => handleRestore(run, 'submitted')}
                              className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                              title="Restore to build page state"
                            >
                              Restore Build
                            </button>
                            <button
                              onClick={() => handleRestore(run, 'results')}
                              className="px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                              title="Restore to results page"
                            >
                              Restore Results
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(run)}
                            className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(run.id)}
                          disabled={deleting === run.id}
                          className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                        >
                          {deleting === run.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


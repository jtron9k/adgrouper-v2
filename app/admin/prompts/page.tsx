'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PromptEditor from '@/components/PromptEditor';
import { PromptTemplates } from '@/types';
import { defaultPrompts } from '@/lib/prompts';

export default function AdminPromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<PromptTemplates>(defaultPrompts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated || data.role !== 'admin') {
          router.replace('/');
          return;
        }
        return fetch('/api/admin/prompts');
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setPrompts(data);
      })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setFeedback(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompts),
      });
      if (!res.ok) {
        const data = await res.json();
        setFeedback({ type: 'error', message: data.error || 'Save failed.' });
        return;
      }
      setFeedback({ type: 'success', message: 'Prompts saved. All new campaigns will use these defaults.' });
    } catch {
      setFeedback({ type: 'error', message: 'Request failed.' });
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Manage Default Prompts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Changes apply to all new campaigns. Existing saved campaigns keep their own prompts.
          </p>
        </div>

        {feedback && (
          <div
            className={`px-4 py-3 rounded text-sm border ${
              feedback.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <PromptEditor
            label="Landing Page Summary Prompt"
            value={prompts.extraction}
            onChange={(value) => setPrompts((p) => ({ ...p, extraction: value }))}
          />
          <PromptEditor
            label="Keyword Grouping Prompt"
            value={prompts.keywordGrouping}
            onChange={(value) => setPrompts((p) => ({ ...p, keywordGrouping: value }))}
          />
          <PromptEditor
            label="Ad Copy Generation Prompt"
            value={prompts.adCopy}
            onChange={(value) => setPrompts((p) => ({ ...p, adCopy: value }))}
          />
          <PromptEditor
            label="Keyword Suggestion Prompt"
            value={prompts.keywordSuggestion}
            onChange={(value) => setPrompts((p) => ({ ...p, keywordSuggestion: value }))}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 font-medium text-sm transition-colors"
          >
            {saving ? 'Saving...' : 'Save Prompts'}
          </button>
        </div>
      </div>
    </div>
  );
}

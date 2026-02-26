'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface KeyPresence {
  openai: boolean;
  gemini: boolean;
  claude: boolean;
}

export default function AdminApiKeysPage() {
  const router = useRouter();
  const [presence, setPresence] = useState<KeyPresence | null>(null);
  const [keys, setKeys] = useState({ openai: '', gemini: '', claude: '' });
  const [showKey, setShowKey] = useState({ openai: false, gemini: false, claude: false });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated || data.role !== 'admin') {
          router.replace('/');
          return;
        }
        return fetch('/api/config/keys');
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setPresence(data);
      })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const toggleShowKey = (key: keyof typeof showKey) =>
    setShowKey((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload = Object.fromEntries(
      Object.entries(keys).filter(([, v]) => v.trim().length > 0)
    );

    if (Object.keys(payload).length === 0) {
      setFeedback({ type: 'error', message: 'Enter at least one key to save.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setFeedback({ type: 'error', message: data.error || 'Save failed.' });
        return;
      }
      setKeys({ openai: '', gemini: '', claude: '' });
      setFeedback({ type: 'success', message: 'Keys saved successfully.' });
      // Refresh presence
      const pr = await fetch('/api/config/keys');
      setPresence(await pr.json());
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

  const keyDefs = [
    { key: 'openai' as const, label: 'OpenAI', placeholder: 'sk-...' },
    { key: 'gemini' as const, label: 'Google Gemini', placeholder: 'AIza...' },
    { key: 'claude' as const, label: 'Anthropic Claude', placeholder: 'sk-ant-...' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Manage API Keys</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Leave a field blank to keep the existing key.
          </p>
        </div>

        {/* Current key status */}
        {presence && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Status</h2>
            {keyDefs.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    presence[key] ? 'bg-green-500' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {presence[key] ? 'Configured' : 'Not set'}
                </span>
              </div>
            ))}
          </div>
        )}

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
          <form onSubmit={handleSave} className="space-y-4">
            {keyDefs.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {label}
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKey[key] ? 'text' : 'password'}
                    value={keys[key]}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(key)}
                    className="px-3 text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {showKey[key] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 font-medium text-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Keys'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [emails, setEmails] = useState<string[]>(['']);
  const [apiKeys, setApiKeys] = useState({ openai: '', gemini: '', claude: '' });
  const [showKey, setShowKey] = useState({ openai: false, gemini: false, claude: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/setup/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.needsSetup) {
          router.push('/login');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const addEmail = () => setEmails((prev) => [...prev, '']);
  const removeEmail = (idx: number) =>
    setEmails((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  const updateEmail = (idx: number, value: string) =>
    setEmails((prev) => prev.map((e, i) => (i === idx ? value : e)));

  const toggleShowKey = (key: keyof typeof showKey) =>
    setShowKey((prev) => ({ ...prev, [key]: !prev[key] }));
  const updateApiKey = (key: keyof typeof apiKeys, value: string) =>
    setApiKeys((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validEmails = emails.map((e) => e.trim()).filter((e) => e.includes('@'));
    if (validEmails.length === 0) {
      setError('At least one valid email address is required.');
      return;
    }

    const hasKey = Object.values(apiKeys).some((v) => v.trim().length > 0);
    if (!hasKey) {
      setError('At least one LLM API key is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/setup/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: validEmails, apiKeys }),
      });

      if (res.status === 403) {
        setError('Already configured, redirecting...');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Setup failed');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-green-600 dark:text-green-400">Setup complete! Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            First-Time Setup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Configure approved users and at least one LLM API key to get started.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Approved Emails */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Approved Emails
            </legend>
            <div className="space-y-2">
              {emails.map((email, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(idx, e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail(idx)}
                      className="px-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      aria-label="Remove email"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEmail}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add another email
            </button>
          </fieldset>

          {/* LLM API Keys */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              LLM API Keys <span className="font-normal text-gray-500 dark:text-gray-400">(at least one required)</span>
            </legend>
            <div className="space-y-3">
              {(
                [
                  { key: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
                  { key: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
                  { key: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-...' },
                ] as const
              ).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showKey[key] ? 'text' : 'password'}
                      value={apiKeys[key]}
                      onChange={(e) => updateApiKey(key, e.target.value)}
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
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 font-medium"
          >
            {submitting ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}

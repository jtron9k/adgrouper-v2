'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface EmailEntry {
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState('');
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated || data.role !== 'admin') {
          router.replace('/');
          return;
        }
        setCurrentEmail(data.email);
        return fetchEmails();
      })
      .catch(() => router.replace('/'));
  }, [router]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/emails');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEmails(data.emails);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  };

  const adminCount = emails.filter((e) => e.role === 'admin').length;

  const handleRoleToggle = async (entry: EmailEntry) => {
    const newRole = entry.role === 'admin' ? 'user' : 'admin';
    setActionFeedback((prev) => ({ ...prev, [entry.email]: '' }));
    try {
      const res = await fetch(`/api/admin/emails/${encodeURIComponent(entry.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionFeedback((prev) => ({ ...prev, [entry.email]: data.error }));
        return;
      }
      await fetchEmails();
    } catch {
      setActionFeedback((prev) => ({ ...prev, [entry.email]: 'Request failed' }));
    }
  };

  const handleDelete = async (entry: EmailEntry) => {
    setActionFeedback((prev) => ({ ...prev, [entry.email]: '' }));
    try {
      const res = await fetch(`/api/admin/emails/${encodeURIComponent(entry.email)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setActionFeedback((prev) => ({ ...prev, [entry.email]: data.error }));
        return;
      }
      await fetchEmails();
    } catch {
      setActionFeedback((prev) => ({ ...prev, [entry.email]: 'Request failed' }));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const email = newEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      setFeedback({ type: 'error', message: 'Invalid email address.' });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFeedback({ type: 'error', message: data.error || 'Failed to add user.' });
        return;
      }
      setNewEmail('');
      setNewRole('user');
      setFeedback({ type: 'success', message: `Added ${email}.` });
      await fetchEmails();
    } catch {
      setFeedback({ type: 'error', message: 'Request failed.' });
    } finally {
      setAdding(false);
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Manage Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Approved emails and their roles.
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {emails.map((entry) => {
                const isSelf = entry.email === currentEmail;
                const isLastAdmin = entry.role === 'admin' && adminCount === 1;
                const canToggle = !isSelf && !isLastAdmin;
                const canDelete = !isSelf && !(entry.role === 'admin' && isLastAdmin);

                return (
                  <tr
                    key={entry.email}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {entry.email}
                      {isSelf && (
                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          entry.role === 'admin'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {entry.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {actionFeedback[entry.email] && (
                          <span className="text-xs text-red-500 dark:text-red-400">
                            {actionFeedback[entry.email]}
                          </span>
                        )}
                        <button
                          onClick={() => handleRoleToggle(entry)}
                          disabled={!canToggle}
                          title={
                            isSelf
                              ? 'Cannot change your own role'
                              : isLastAdmin
                              ? 'Cannot demote the last admin'
                              : undefined
                          }
                          className="px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {entry.role === 'admin' ? 'Make User' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          disabled={!canDelete}
                          title={
                            isSelf
                              ? 'Cannot delete your own account'
                              : isLastAdmin
                              ? 'Cannot delete the last admin'
                              : undefined
                          }
                          className="px-2.5 py-1 text-xs rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add User form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Add User</h2>
          <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

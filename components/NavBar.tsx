'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email || null);
          setRole(data.role ?? null);
        } else {
          setEmail(null);
          setRole(null);
        }
      } catch {
        setEmail(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    updateSession();

    const handleAuthStateChanged = () => {
      updateSession();
    };
    window.addEventListener('auth-state-changed', handleAuthStateChanged);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, []);

  // Close admin dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setEmail(null);
      setRole(null);
      window.dispatchEvent(new Event('auth-state-changed'));
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;
  const isAdminPath = pathname.startsWith('/admin');

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Search Ads Campaign Builder
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                href="/history"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/history')
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                History
              </Link>
              {role === 'admin' && (
                <div className="relative" ref={adminRef}>
                  <button
                    onClick={() => setAdminOpen((o) => !o)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                      isAdminPath
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Admin
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${adminOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {adminOpen && (
                    <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                      <Link
                        href="/admin/users"
                        onClick={() => setAdminOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive('/admin/users')
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        Manage Users
                      </Link>
                      <Link
                        href="/admin/api-keys"
                        onClick={() => setAdminOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive('/admin/api-keys')
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        Manage API Keys
                      </Link>
                      <Link
                        href="/admin/prompts"
                        onClick={() => setAdminOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive('/admin/prompts')
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        Manage Prompts
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : email ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  {email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/login')
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

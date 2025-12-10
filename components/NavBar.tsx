'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const updateUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    // Get initial session
    updateUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Listen for custom auth state change event
    const handleAuthStateChanged = () => {
      updateUser();
    };
    window.addEventListener('auth-state-changed', handleAuthStateChanged);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Ad Campaign Builder
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
            </div>
          </div>
          <div className="flex items-center">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  {user.email}
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


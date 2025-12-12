'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ModelSelector from '@/components/ModelSelector';
import { AIProvider } from '@/types';
import { createClient } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSelect = (provider: AIProvider) => {
    // Store in sessionStorage for use in build page (no API keys)
    sessionStorage.setItem('provider', JSON.stringify(provider));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return <ModelSelector onSelect={handleSelect} />;
}





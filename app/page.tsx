'use client';

import { useRouter } from 'next/navigation';
import ModelSelector from '@/components/ModelSelector';
import { AIProvider } from '@/types';

export default function Home() {
  const router = useRouter();

  const handleSelect = (provider: AIProvider, firecrawlKey: string) => {
    // Store in sessionStorage for use in build page
    sessionStorage.setItem('provider', JSON.stringify(provider));
    sessionStorage.setItem('firecrawlKey', firecrawlKey);
  };

  return <ModelSelector onSelect={handleSelect} />;
}





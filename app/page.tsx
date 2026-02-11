'use client';

import { useRouter } from 'next/navigation';
import ModelSelector from '@/components/ModelSelector';
import { AIProvider } from '@/types';

export default function Home() {
  const router = useRouter();

  const handleSelect = (provider: AIProvider) => {
    sessionStorage.setItem('provider', JSON.stringify(provider));
  };

  return <ModelSelector onSelect={handleSelect} />;
}





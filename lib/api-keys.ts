import { createAdminSupabaseClient } from './supabase-server';

export type ApiKeyType = 'openai' | 'gemini' | 'claude';

/**
 * Fetches an API key from Supabase by key type.
 * This function should only be called server-side from authenticated routes.
 */
export async function getApiKey(keyType: ApiKeyType): Promise<string> {
  const supabase = createAdminSupabaseClient();
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('key_type', keyType)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch ${keyType} API key: ${error?.message || 'Key not found'}`);
  }

  return data.api_key;
}

/**
 * Fetches all API keys from Supabase.
 * Returns an object with all key types.
 */
export async function getAllApiKeys(): Promise<{
  openai: string;
  gemini: string;
  claude: string;
}> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('api_keys')
    .select('key_type, api_key');

  if (error || !data) {
    throw new Error(`Failed to fetch API keys: ${error?.message || 'Keys not found'}`);
  }

  const keys: Record<string, string> = {};
  data.forEach((row: { key_type: string; api_key: string }) => {
    keys[row.key_type] = row.api_key;
  });

  return {
    openai: keys.openai || '',
    gemini: keys.gemini || '',
    claude: keys.claude || '',
  };
}






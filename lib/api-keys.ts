export type ApiKeyType = 'openai' | 'gemini' | 'claude';

const ENV_MAP: Record<ApiKeyType, string> = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
};

/**
 * Returns an API key, checking the DB first then falling back to env vars.
 * Throws if neither source has a value.
 */
export function getApiKey(keyType: ApiKeyType): string {
  // Inline import to avoid circular dep (api-keys ← db ← api-keys)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getApiKeyFromDb } = require('./db') as typeof import('./db');
  const dbValue = getApiKeyFromDb(keyType);
  if (dbValue) return dbValue;

  const envValue = process.env[ENV_MAP[keyType]];
  if (envValue) return envValue;

  throw new Error(
    `No API key configured for "${keyType}". Add it via the setup page or set ${ENV_MAP[keyType]} in .env.local.`
  );
}

/**
 * Returns presence booleans for all three LLM API keys.
 * Checks DB first, then env vars. Does not return the actual key values.
 */
export function getAllApiKeyPresence(): { openai: boolean; gemini: boolean; claude: boolean } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getApiKeyFromDb } = require('./db') as typeof import('./db');
  const keys: ApiKeyType[] = ['openai', 'gemini', 'claude'];
  const result = {} as { openai: boolean; gemini: boolean; claude: boolean };
  for (const key of keys) {
    result[key] = !!(getApiKeyFromDb(key) || process.env[ENV_MAP[key]]);
  }
  return result;
}

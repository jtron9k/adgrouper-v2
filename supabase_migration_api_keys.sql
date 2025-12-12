-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_type TEXT UNIQUE NOT NULL, -- 'firecrawl', 'openai', 'gemini', 'claude'
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert API keys (replace placeholders with your actual keys)
-- IMPORTANT: Replace the placeholder values below with your actual API keys before running this migration
INSERT INTO api_keys (key_type, api_key) VALUES
  ('firecrawl', 'your-firecrawl-api-key-here'),
  ('claude', 'your-claude-api-key-here'),
  ('openai', 'your-openai-api-key-here'),
  ('gemini', 'your-gemini-api-key-here')
ON CONFLICT (key_type) DO UPDATE SET api_key = EXCLUDED.api_key, updated_at = NOW();

-- Add RLS policy (only authenticated users can read)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated users can read api_keys" ON api_keys;

-- Create policy for authenticated users to read
CREATE POLICY "Authenticated users can read api_keys" ON api_keys
  FOR SELECT USING (auth.role() = 'authenticated');

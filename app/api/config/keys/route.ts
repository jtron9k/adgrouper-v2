import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * API route to fetch API keys for client-side use.
 * Only returns keys to authenticated users.
 * Note: This route exists for compatibility but keys should ideally
 * never be sent to the client. Consider removing this if not needed.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all API keys
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_type, api_key');

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    const keys: Record<string, string> = {};
    data.forEach((row) => {
      keys[row.key_type] = row.api_key;
    });

    return NextResponse.json({
      firecrawl: keys.firecrawl || '',
      openai: keys.openai || '',
      gemini: keys.gemini || '',
      claude: keys.claude || '',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'An error occurred while fetching API keys' },
      { status: 500 }
    );
  }
}

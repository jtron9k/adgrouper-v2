import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabaseClient();
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

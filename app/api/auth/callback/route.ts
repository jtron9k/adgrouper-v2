import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      // Check approved_emails for OAuth users (GitHub, etc.)
      const normalizedEmail = data.user.email.toLowerCase().trim();
      const { data: approvedEmail, error: emailError } = await supabase
        .from('approved_emails')
        .select('email')
        .eq('email', normalizedEmail)
        .single();

      if (emailError || !approvedEmail) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not_approved`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}










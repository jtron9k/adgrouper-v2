import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const cookieStore = await cookies();

    // Validate inputs
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

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

    // Check if email is approved
    const { data: approvedEmail, error: emailError } = await supabase
      .from('approved_emails')
      .select('email')
      .eq('email', normalizedEmail)
      .single();

    // Use generic error message regardless of why check failed
    // This prevents information leakage about whether email exists in table
    if (emailError || !approvedEmail) {
      return NextResponse.json(
        { error: 'This email is not approved for access.' },
        { status: 401 }
      );
    }

    // Get origin for redirect URL (e.g. https://yourdomain.com or http://localhost:3000)
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const redirectTo = `${origin}/api/auth/callback`;

    // Send magic link - no password required
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true, // Create user on first magic link if approved
        emailRedirectTo: redirectTo,
      },
    });

    // Use generic error messages to avoid information leakage
    if (authError) {
      return NextResponse.json(
        { error: 'An error occurred. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Check your email for a sign-in link.',
    });
  } catch (error: any) {
    // Catch any unexpected errors and return generic message
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}


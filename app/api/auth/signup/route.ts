import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const cookieStore = await cookies();
    
    // Get the correct redirect URL - use environment variable if set, otherwise use request origin
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
    const emailRedirectTo = redirectUrl ? `${redirectUrl}/api/auth/callback` : undefined;

    // Validate email format
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
        { error: 'Sign-up is not available for this email address' },
        { status: 403 }
      );
    }

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo,
      },
    });

    // Use generic error messages for auth errors to avoid information leakage
    if (error) {
      return NextResponse.json(
        { error: 'Unable to send magic link. Please try again later.' },
        { status: 400 }
      );
    }

    // Always return success message (even if email doesn't exist) to prevent enumeration
    return NextResponse.json({ 
      message: 'Check your email for the magic link'
    });
  } catch (error: any) {
    // Catch any unexpected errors and return generic message
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}


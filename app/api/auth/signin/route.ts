import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie } from '@/lib/auth-session';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate inputs
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    const supabase = await createServerSupabaseClient();

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
        { error: 'This email is not approved. Please contact your administrator.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(normalizedEmail);
    const response = NextResponse.json({
      success: true,
      email: normalizedEmail,
    });
    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    // Catch any unexpected errors and return generic message
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

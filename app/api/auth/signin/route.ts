import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const supabase = createAdminSupabaseClient();
    const { data: approvedEmail, error: emailError } = await supabase
      .from('approved_emails')
      .select('email')
      .eq('email', normalizedEmail)
      .single();

    if (emailError || !approvedEmail) {
      return NextResponse.json(
        { error: 'This email is not approved for access.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    setSessionCookie(response, normalizedEmail);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

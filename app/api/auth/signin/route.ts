import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie } from '@/lib/auth-session';
import { isEmailApproved } from '@/lib/db';

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

    // Check if email is approved
    if (!isEmailApproved(normalizedEmail)) {
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
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

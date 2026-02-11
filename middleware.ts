import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'app_session';

// Routes that require a valid session
const protectedPaths = ['/', '/build', '/history', '/results'];
// Auth routes - redirect to / if already logged in
const authPaths = ['/login'];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAuthPath(pathname: string): boolean {
  return authPaths.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (isAuthPath(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSetupRoute =
    pathname.startsWith('/setup') || pathname.startsWith('/api/setup/');

  if (!process.env.AUTH_SESSION_SECRET) {
    if (isSetupRoute) return NextResponse.next({ request });
    console.error('Missing AUTH_SESSION_SECRET environment variable');
    return NextResponse.json(
      { error: 'Server configuration error. Please contact support.' },
      { status: 500 }
    );
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

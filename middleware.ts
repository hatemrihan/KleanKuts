import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and waitlist page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname === '/waitlist'
  ) {
    return NextResponse.next();
  }

  try {
    // Fetch site status from admin API
    const response = await fetch('https://eleveadmin.netlify.app/api/test-settings', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch site status');
    }

    const data = await response.json();
    
    // If site is inactive, redirect ALL traffic to waitlist
    if (data?.data?.active === false) {
      const url = request.nextUrl.clone();
      url.pathname = '/waitlist';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error checking site status:', error);
    // On error, redirect to waitlist as a safety measure
    const url = request.nextUrl.clone();
    url.pathname = '/waitlist';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public|waitlist).*)',
  ]
};
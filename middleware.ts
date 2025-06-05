import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and waitlist page
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname === '/waitlist'
  ) {
    return NextResponse.next();
  }

  try {
    // Fetch site status from admin API - using correct endpoint
    const response = await fetch('https://eleveadmin.netlify.app/api/site-status', {
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
    console.log('[MIDDLEWARE] Site status:', data);
    
    // If site is inactive, redirect ALL traffic to waitlist
    if (data?.status === 'inactive') {
      const url = request.nextUrl.clone();
      url.pathname = '/waitlist';
      return NextResponse.redirect(url);
    }

    // If on waitlist but site is active, redirect to home
    if (pathname === '/waitlist' && data?.status === 'active') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error checking site status:', error);
    // On error, allow normal flow (don't break the site)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public).*)',
  ]
};
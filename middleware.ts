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
    console.log('[MIDDLEWARE] Checking site status for path:', pathname);
    
    // Fetch site status from admin API - using correct endpoint
    const response = await fetch('https://eleveadmin.netlify.app/api/site-status', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    console.log('[MIDDLEWARE] API response status:', response.status);
    
    if (!response.ok) {
      console.error('[MIDDLEWARE] API request failed:', response.status, response.statusText);
      return NextResponse.next();
    }

    const data = await response.json();
    console.log('[MIDDLEWARE] Full API response:', JSON.stringify(data, null, 2));
    
    // Check different possible response formats
    const isInactive = 
      data?.status === 'inactive' || 
      data?.active === false || 
      data?.data?.active === false ||
      data?.maintenance === true ||
      data?.data?.maintenance === true;
    
    console.log('[MIDDLEWARE] Site inactive check result:', isInactive);
    
    // If site is inactive, redirect ALL traffic to waitlist
    if (isInactive) {
      console.log('[MIDDLEWARE] Site is inactive, redirecting to waitlist');
      const url = request.nextUrl.clone();
      url.pathname = '/waitlist';
      return NextResponse.redirect(url);
    }

    // If on waitlist but site is active, redirect to home
    if (pathname === '/waitlist' && !isInactive) {
      console.log('[MIDDLEWARE] Site is active, redirecting away from waitlist');
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    console.log('[MIDDLEWARE] Allowing normal flow');
    return NextResponse.next();
  } catch (error) {
    console.error('[MIDDLEWARE] Error checking site status:', error);
    // On error, allow normal flow (don't break the site)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public).*)',
  ]
};
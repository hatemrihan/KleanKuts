import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Add this console.log at the START as requested by admin
  console.log('[MIDDLEWARE] Running on path:', request.nextUrl.pathname);
  
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and waitlist page
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname === '/waitlist'
  ) {
    console.log('[MIDDLEWARE] Skipping middleware for:', pathname);
    return NextResponse.next();
  }

  try {
    // Add this in middleware before checking site status as requested by admin
    console.log('[MIDDLEWARE] Checking site status...');
    
    // Fetch site status from admin API - using correct endpoint
    const response = await fetch('https://eleveadmin.netlify.app/api/site-status', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    console.log('[MIDDLEWARE] API Response status:', response.status);
    
    if (!response.ok) {
      console.error('[MIDDLEWARE] API request failed:', response.status, response.statusText);
      return NextResponse.next();
    }

    const data = await response.json();
    console.log('[MIDDLEWARE] Site status data:', data);
    
    // Check admin's exact format: {status: "inactive"} or {status: "active"}
    const isInactive = data.status === 'inactive';
    
    console.log('[MIDDLEWARE] Site inactive check result:', isInactive);
    console.log('[MIDDLEWARE] Current pathname:', pathname);
    
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
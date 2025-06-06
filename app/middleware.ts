import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setCorsHeaders } from '@/lib/api-utils';

// Custom assert polyfill
const assert = (condition: boolean, message?: string) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

// Simple middleware that only handles essential functionality
export function middleware(request: NextRequest) {
  // Add security headers and CORS headers
  const response = NextResponse.next();
  
  // Add CORS headers from our utility
  const corsHeaders = setCorsHeaders(request);
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  // Basic security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
    return NextResponse.redirect(`https://${request.url.split('//')[1]}`);
  }

  return response;
}

// Only run middleware on API routes and auth endpoints
export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*'
  ],
}; 
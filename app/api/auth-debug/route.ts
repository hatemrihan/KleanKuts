import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get environment variables that are safe to expose
  const safeEnvVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'Not set',
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    baseUrl: process.env.NEXTAUTH_URL || request.nextUrl.origin,
    host: request.headers.get('host') || 'unknown',
    protocol: request.headers.get('x-forwarded-proto') || 'http'
  };

  console.log('Auth Debug API called:', {
    envVars: safeEnvVars,
    headers: Object.fromEntries(request.headers.entries())
  });

  return NextResponse.json(safeEnvVars);
}

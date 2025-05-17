import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://elevee.netlify.app',
  'https://eleveadmin.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Helper to handle CORS headers
export function setCorsHeaders(request: Request | NextRequest) {
  const origin = request.headers.get('origin');
  const headers = new Headers();
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // Default to main site if no origin matches
    headers.set('Access-Control-Allow-Origin', 'https://elevee.netlify.app');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return headers;
}

// Helper to create a CORS-enabled response
export function corsResponse(data: any, options: { status?: number } = {}) {
  const { status = 200 } = options;
  
  // Get headers from the request in the context
  const request = new Request('https://example.com');
  const headers = setCorsHeaders(request);
  
  return NextResponse.json(data, { 
    status, 
    headers 
  });
}

// Helper for CORS preflight requests
export function corsOptions(request: Request) {
  const headers = setCorsHeaders(request);
  return new NextResponse(null, { status: 204, headers });
} 
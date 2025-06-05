import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[SITE STATUS API] Request received');
    
    // Fetch from admin API server-side (no CORS issues)
    const response = await fetch('https://eleveadmin.netlify.app/api/site-status', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    console.log('[SITE STATUS API] Admin API response status:', response.status);

    if (!response.ok) {
      console.error('[SITE STATUS API] Admin API failed:', response.status);
      // Default to active if admin API fails
      return NextResponse.json({ 
        status: 'active', 
        message: 'Site is currently active',
        error: 'Failed to fetch from admin API'
      });
    }

    const data = await response.json();
    console.log('[SITE STATUS API] Admin API response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[SITE STATUS API] Error:', error);
    // Default to active on error
    return NextResponse.json({ 
      status: 'active', 
      message: 'Site is currently active',
      error: 'Server error occurred'
    });
  }
} 
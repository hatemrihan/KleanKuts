import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[WAITLIST API] Request received');
    
    const body = await request.json();
    const { email } = body;
    
    console.log('[WAITLIST API] Email received:', email);

    if (!email) {
      console.log('[WAITLIST API] No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[WAITLIST API] Sending to admin API...');
    
    // Proxy to admin API from server-side (no CORS issues)
    const response = await fetch('https://eleveadmin.netlify.app/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        source: 'e-commerce',
        notes: 'Submitted from e-commerce site'
      })
    });

    console.log('[WAITLIST API] Admin API response status:', response.status);
    console.log('[WAITLIST API] Admin API response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('[WAITLIST API] Admin API success response:', data);
      return NextResponse.json({ success: true, data });
    } else {
      const errorText = await response.text();
      console.error('[WAITLIST API] Admin API error response:', errorText);
      console.error('[WAITLIST API] Admin API error status:', response.status);
      
      return NextResponse.json({ 
        error: 'Failed to submit to admin API', 
        details: errorText,
        adminStatus: response.status 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[WAITLIST API] Server error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

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

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
    }
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 
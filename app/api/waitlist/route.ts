import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for emails (in production, use database)
const waitlistEmails: string[] = [];

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

    // Save email locally first (always works)
    if (!waitlistEmails.includes(email)) {
      waitlistEmails.push(email);
      console.log('[WAITLIST API] Email saved locally. Total emails:', waitlistEmails.length);
    }

    // Try to send to admin API but don't fail if it doesn't work
    let adminSuccess = false;
    let adminError = null;

    try {
      console.log('[WAITLIST API] Attempting to send to admin API...');
      
      const response = await fetch('https://eleveadmin.netlify.app/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'e-commerce'
        })
      });

      console.log('[WAITLIST API] Admin API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[WAITLIST API] Admin API success response:', data);
        adminSuccess = true;
      } else {
        const errorText = await response.text();
        console.error('[WAITLIST API] Admin API error response:', errorText);
        adminError = `Admin API returned ${response.status}: ${errorText}`;
      }
    } catch (fetchError) {
      console.error('[WAITLIST API] Admin API fetch error:', fetchError);
      adminError = `Failed to connect to admin API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
    }

    // Always return success since we saved locally
    return NextResponse.json({ 
      success: true, 
      message: 'Email added to waitlist successfully',
      savedLocally: true,
      adminNotified: adminSuccess,
      adminError: adminSuccess ? null : adminError,
      totalEmails: waitlistEmails.length
    });

  } catch (error) {
    console.error('[WAITLIST API] Server error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// GET endpoint to view saved emails (for debugging)
export async function GET() {
  return NextResponse.json({ 
    emails: waitlistEmails,
    count: waitlistEmails.length 
  });
} 
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Ambassador from '@/models/Ambassador';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// This endpoint handles updating an ambassador's product video link
export async function POST(req: Request) {
  try {
    console.log('[VIDEO LINK API] Request received');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[VIDEO LINK API] No authentication found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { email, productVideoLink } = await req.json();
    console.log('[VIDEO LINK API] Email:', email);
    console.log('[VIDEO LINK API] Video Link:', productVideoLink);

    // Validate that the authenticated user matches the request
    if (email !== session.user.email) {
      console.log('[VIDEO LINK API] Email mismatch - session:', session.user.email, 'request:', email);
      return NextResponse.json(
        { error: 'Unauthorized - email mismatch' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!email || !productVideoLink) {
      console.log('[VIDEO LINK API] Missing required fields');
      return NextResponse.json(
        { error: 'Email and product video link are required' },
        { status: 400 }
      );
    }

    // Validate social media URL format
    const socialMediaRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com|tiktok\.com|twitter\.com|threads\.net|vimeo\.com|snapchat\.com)\/.+/;
    if (!socialMediaRegex.test(productVideoLink)) {
      console.log('[VIDEO LINK API] Invalid URL format');
      return NextResponse.json(
        { error: 'Invalid social media URL. Please provide a valid URL from YouTube, Facebook, Instagram, TikTok, Twitter, Threads, Vimeo, or Snapchat.' },
        { status: 400 }
      );
    }

    console.log('[VIDEO LINK API] Connecting to MongoDB...');
    
    // Connect to MongoDB
    await dbConnect();

    // Find and validate the ambassador
    const ambassador = await Ambassador.findOne({ email });
    if (!ambassador) {
      console.log('[VIDEO LINK API] Ambassador not found in database');
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }

    console.log('[VIDEO LINK API] Ambassador found, updating local record...');

    // First, update the local record regardless of admin API success
    ambassador.productVideoLink = productVideoLink;
    ambassador.lastUpdated = new Date();
    await ambassador.save();

    console.log('[VIDEO LINK API] Local record updated successfully');

    // Try to send to admin API but don't fail if it doesn't work
    let adminSuccess = false;
    let adminError = null;

    try {
      console.log('[VIDEO LINK API] Attempting to notify admin API...');
      
      const adminEndpoint = process.env.ADMIN_API_URL || 'https://eleveadmin.netlify.app';
      const adminResponse = await fetch(`${adminEndpoint}/api/ambassadors/update-video-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ADMIN_API_KEY || ''}`,
          'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app'
        },
        body: JSON.stringify({ 
          email, 
          productVideoLink,
          ambassadorId: ambassador._id.toString()
        }),
      });

      console.log('[VIDEO LINK API] Admin API response status:', adminResponse.status);

      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('[VIDEO LINK API] Admin API success:', adminData);
        adminSuccess = true;
      } else {
        const adminErrorText = await adminResponse.text();
        console.error('[VIDEO LINK API] Admin API error response:', adminErrorText);
        adminError = `Admin API returned ${adminResponse.status}: ${adminErrorText}`;
      }
    } catch (fetchError) {
      console.error('[VIDEO LINK API] Admin API fetch error:', fetchError);
      adminError = `Failed to connect to admin API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
    }

    // Return success regardless of admin API status since local save worked
    return NextResponse.json({
      success: true,
      message: 'Video link updated successfully',
      timestamp: ambassador.lastUpdated,
      adminNotified: adminSuccess,
      adminError: adminSuccess ? null : adminError
    }, { status: 200 });

  } catch (error) {
    console.error('[VIDEO LINK API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

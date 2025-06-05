import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Ambassador from '@/models/Ambassador';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// This endpoint handles updating an ambassador's product video link
export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { email, productVideoLink } = await req.json();

    // Validate that the authenticated user matches the request
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized - email mismatch' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!email || !productVideoLink) {
      return NextResponse.json(
        { error: 'Email and product video link are required' },
        { status: 400 }
      );
    }

    // Validate social media URL format
    const socialMediaRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com|tiktok\.com|twitter\.com|threads\.net|vimeo\.com|snapchat\.com)\/.+/;
    if (!socialMediaRegex.test(productVideoLink)) {
      return NextResponse.json(
        { error: 'Invalid social media URL. Please provide a valid URL from YouTube, Facebook, Instagram, TikTok, Twitter, Threads, Vimeo, or Snapchat.' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await dbConnect();

    // Find and validate the ambassador
    const ambassador = await Ambassador.findOne({ email });
    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }

    // Send the data to the admin API
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
        ambassadorId: ambassador._id 
      }),
    });

    if (!adminResponse.ok) {
      const adminError = await adminResponse.text();
      console.error('Failed to update video link on admin API:', adminError);
      
      // Return appropriate status code based on admin response
      const statusCode = adminResponse.status === 404 ? 404 : 500;
      return NextResponse.json(
        { error: 'Failed to update video link on admin server' },
        { status: statusCode }
      );
    }

    // Update the ambassador's local record with modified timestamp
    ambassador.productVideoLink = productVideoLink;
    ambassador.lastUpdated = new Date();
    await ambassador.save();

    return NextResponse.json({
      success: true,
      message: 'Video link updated successfully',
      timestamp: ambassador.lastUpdated
    }, { status: 200 });
  } catch (error) {
    console.error('Error in update-video-link API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

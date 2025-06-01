import { NextResponse } from 'next/server';

// This endpoint handles updating an ambassador's product video link
export async function POST(req: Request) {
  try {
    const { email, productVideoLink } = await req.json();

    if (!email || !productVideoLink) {
      return NextResponse.json(
        { error: 'Email and product video link are required' },
        { status: 400 }
      );
    }

    // Send the data to the admin API
    const adminResponse = await fetch(`${process.env.ADMIN_API_URL}/api/ambassadors/update-video-link` || 'https://eleveadmin.netlify.app/api/ambassadors/update-video-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY || ''}`,
      },
      body: JSON.stringify({ email, productVideoLink }),
    });

    if (!adminResponse.ok) {
      console.error('Failed to update video link on admin API:', await adminResponse.text());
      return NextResponse.json(
        { error: 'Failed to update video link' },
        { status: 500 }
      );
    }

    // Update the ambassador's local data as well
    // This would normally involve a database update, but we'll simulate success
    return NextResponse.json(
      { success: true, message: 'Video link updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in update-video-link API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

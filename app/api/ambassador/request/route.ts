import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Ambassador from '@/models/Ambassador'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { name, email, formData } = await request.json()
    
    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Make sure the email in the request matches the authenticated user's email
    if (email !== session.user?.email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 })
    }

    try {
      // Connect to MongoDB
      await dbConnect()
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Check if this user already has an ambassador request
    let existingRequest
    try {
      existingRequest = await Ambassador.findOne({ email })
      
      if (existingRequest) {
        return NextResponse.json({ 
          error: 'You already have an ambassador request',
          status: existingRequest.status 
        }, { status: 409 })
      }
    } catch (findError) {
      console.error('Error checking for existing ambassador:', findError)
      // Continue even if this fails - we'll try to create a new entry
    }

    // Get admin site URL for notification purposes
    const adminSiteUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://eleveadmin.netlify.app'
    
    // Create the ambassador record - the schema will handle the referral code
    try {
      // Simplified create call - we let the schema handle defaults
      const result = await Ambassador.create({
        name,
        email,
        userId: session.user?.email || '', // Use email as unique identifier
        couponCode: '', // Will be assigned by admin
        applicationDetails: formData,
      })
      
      // Notify admin about the new ambassador request
      if (result) {
        try {
          // Send notification to the admin site about the new request
          const adminApiUrl = `${adminSiteUrl}/api/notifications` || 'https://eleveadmin.netlify.app/api/notifications';
          
          console.log(`Sending notification to admin panel at: ${adminApiUrl}`);
          
          // Send the data to the admin panel
          const adminNotifyResponse = await fetch(adminApiUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ADMIN_API_KEY || 'admin-api-key'}` // Use environment variable or default
            },
            body: JSON.stringify({
              type: 'new_ambassador_request',
              data: { 
                name, 
                email, 
                userId: session.user?.email || '',
                requestId: result._id.toString(),
                timestamp: new Date().toISOString(),
                status: 'pending',
                applicationDetails: formData
              }
            })
          });
          
          // Log the response from admin notification
          if (adminNotifyResponse.ok) {
            console.log('Successfully notified admin panel about new ambassador application');
          } else {
            const errorText = await adminNotifyResponse.text();
            console.error('Failed to notify admin panel:', adminNotifyResponse.status, errorText);
          }
        } catch (notifyError) {
          // Don't fail the request if notification fails, just log it
          console.error('Error notifying admin site:', notifyError)
        }
      }

      return NextResponse.json({ 
        success: true,
        message: 'Ambassador request submitted successfully'
      })
      
    } catch (createError) {
      console.error('Error creating ambassador record:', createError)
      return NextResponse.json({ 
        error: 'Failed to create ambassador record. Please try again later.',
        details: createError instanceof Error ? createError.message : 'Unknown error' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating ambassador request:', error)
    return NextResponse.json({ error: 'Failed to submit ambassador request' }, { status: 500 })
  }
}


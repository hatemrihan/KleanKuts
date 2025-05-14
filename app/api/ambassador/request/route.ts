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

    // Connect to MongoDB
    await dbConnect()

    // Check if this user already has an ambassador request
    const existingRequest = await Ambassador.findOne({ email })
    
    if (existingRequest) {
      return NextResponse.json({ 
        error: 'You already have an ambassador request',
        status: existingRequest.status 
      }, { status: 409 })
    }

    // Generate a unique referral link
    const referralCode = generateReferralCode(name)
    // Ensure we're using the correct production URL
    const mainSiteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app'
    const referralLink = `${mainSiteUrl}?ref=${referralCode}`
    
    // Get admin site URL for notification purposes
    const adminSiteUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://eleveadmin.netlify.app'
    
    // Create the ambassador record
    const result = await Ambassador.create({
      name,
      email,
      userId: session.user?.email || '', // Use email as unique identifier
      referralCode,
      referralLink,
      couponCode: '', // Will be assigned by admin
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      // Store the full form data for admin review
      applicationDetails: formData,
      // Initialize tracking stats
      referrals: 0,
      orders: 0,
      conversions: 0,
      sales: 0,
      earnings: 0,
      paymentsPending: 0,
      paymentsPaid: 0
    })

    // Notify admin about the new ambassador request via localStorage and admin dashboard API
    try {
      // Attempt to notify the admin site about the new request
      // In a production environment, this would be implemented with a webhook or admin notification API
      // For now, we'll log the information that would be sent
      console.log(`New ambassador request notification for admin site (${adminSiteUrl}):`)
      console.log({
        type: 'new_ambassador_request',
        name,
        email,
        userId: session.user?.email || '',
        requestId: result._id.toString(),
        timestamp: new Date().toISOString(),
        status: 'pending'
      })

      // In a real implementation, you would send this data to the admin site
      // await fetch(`${adminSiteUrl}/api/notifications`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type: 'new_ambassador_request',
      //     data: { name, email, requestId: result._id.toString() }
      //   })
      // })
    } catch (notifyError) {
      // Don't fail the request if notification fails, just log it
      console.error('Error notifying admin site:', notifyError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Ambassador request submitted successfully'
    })
    
  } catch (error) {
    console.error('Error creating ambassador request:', error)
    return NextResponse.json({ error: 'Failed to submit ambassador request' }, { status: 500 })
  }
}

// Helper function to generate a referral code based on name
function generateReferralCode(name: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const randomString = Math.random().toString(36).substring(2, 6)
  return `${cleanName.substring(0, 6)}${randomString}`
}

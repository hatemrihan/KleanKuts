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
    
    const { name, email, userId } = await request.json()
    
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
    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app'}?ref=${referralCode}`
    
    // Create the ambassador record
    const result = await Ambassador.create({
      name,
      email,
      userId,
      referralCode,
      referralLink,
      couponCode: '', // Will be assigned by admin
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      referrals: 0,
      orders: 0,
      conversions: 0,
      sales: 0,
      earnings: 0,
      paymentsPending: 0,
      paymentsPaid: 0
    })

    // Notify admin about the new ambassador request (you'd implement this part)
    // This could be an email notification or a webhook to another service

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

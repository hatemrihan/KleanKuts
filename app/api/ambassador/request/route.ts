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

    // Generate a unique referral link - ensure name is not empty
    let referralCode = generateReferralCode(name.trim() || `user${Date.now()}`)
    
    // Validate referral code is not null or empty
    if (!referralCode || referralCode.trim() === '') {
      // Fallback to a completely random code if something went wrong
      const timestamp = Date.now().toString(36)
      const randomStr = Math.random().toString(36).substring(2, 8)
      referralCode = `eleve${timestamp}${randomStr}`
    }
    
    // Ensure we're using the correct production URL
    const mainSiteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app'
    let referralLink = `${mainSiteUrl}?ref=${referralCode}`
    
    // Get admin site URL for notification purposes
    const adminSiteUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://eleveadmin.netlify.app'
    
    // Create the ambassador record
    let result
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        // If this is a retry, generate a new referral code
        if (retryCount > 0) {
          console.log(`Retrying with a new referral code (attempt ${retryCount + 1})`)
          // Create a completely new referral code instead of modifying the existing one
          referralCode = generateReferralCode(`${name}_${Date.now()}_${retryCount}`)
          referralLink = `${mainSiteUrl}?ref=${referralCode}`
        }
        
        // Extra validation to ensure referralCode is not null
        if (!referralCode || typeof referralCode !== 'string' || referralCode.trim() === '') {
          // Generate a completely new one with timestamp
          const fallbackTimestamp = Date.now().toString(36)
          const fallbackRandom = Math.random().toString(36).substring(2, 8)
          referralCode = `eleve${fallbackTimestamp}${fallbackRandom}`
          referralLink = `${mainSiteUrl}?ref=${referralCode}`
          console.log('Generated fallback referral code:', referralCode)
        }
        
        // Log the referral code being used (helps with debugging)
        console.log('Attempting to create ambassador with referral code:', referralCode)
        
        // Attempt to create the ambassador record
        result = await Ambassador.create({
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
          paymentsPaid: 0,
          commissionRate: 50 // Default 50% commission
        })
        
        // If we reach here, the creation was successful
        break
      } catch (createError: any) {
        // Check if this is a duplicate key error
        if (createError.code === 11000 && createError.keyPattern?.referralCode && retryCount < maxRetries - 1) {
          console.log('Encountered duplicate referral code, will retry with a new one')
          retryCount++
          continue
        }
        
        // For other errors or if we've exhausted retries, throw the error
        console.error('Error creating ambassador record:', createError)
        return NextResponse.json({ error: 'Failed to create ambassador record. Please try again later.' }, { status: 500 })
      }
    }

    // Notify admin about the new ambassador request by sending data to the admin panel
    try {
      // Only send notification if result exists
      if (!result) {
        throw new Error('Ambassador creation failed with no error')
      }
      
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
  if (!name || name.trim() === '') {
    // If no name is provided, use a timestamp and random string
    const timestamp = Date.now().toString(36)
    const randomString = Math.random().toString(36).substring(2, 8)
    return `amb${timestamp}${randomString}`
  }
  
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  // Add a timestamp to make the code more unique
  const timestamp = Date.now().toString(36)
  const randomString = Math.random().toString(36).substring(2, 6)
  return `${cleanName.substring(0, 6)}${timestamp.substring(0, 4)}${randomString}`
}


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Ambassador from '@/models/Ambassador';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Coupon code is required'
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await dbConnect();
    
    // Find ambassador with this coupon code
    const ambassador = await Ambassador.findOne({ 
      couponCode: code,
      status: 'approved' // Only approved ambassadors have valid coupon codes
    });

    if (!ambassador) {
      return NextResponse.json(
        { 
          success: false,
          valid: false,
          message: 'Invalid coupon code'
        }
      );
    }

    // Return ambassador info with the coupon code
    return NextResponse.json({
      success: true,
      valid: true,
      ambassadorId: ambassador._id.toString(),
      ambassadorName: ambassador.name,
      referralCode: ambassador.referralCode,
      commissionRate: ambassador.commissionRate || 50 // Default 50% if not specified
    });

  } catch (error) {
    console.error('Error validating coupon code:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to validate coupon code'
      },
      { status: 500 }
    );
  }
}

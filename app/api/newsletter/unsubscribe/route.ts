import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Newsletter from '../../../../models/Newsletter';
import { handleDatabaseError, handleApiError } from '../../../utils/errorHandling';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate email
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Normalize email
    const email = body.email.toLowerCase().trim();
    
    // Find and update the subscription
    const result = await Newsletter.findOneAndUpdate(
      { email },
      { subscribed: false },
      { new: true }
    );
    
    if (!result) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Successfully unsubscribed', success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error unsubscribing from newsletter:', error);
    
    // Check if it's a database connection error
    if (error.name?.includes('Mongo') || error.message?.includes('connect')) {
      return handleDatabaseError(error);
    }
    
    // Other API errors
    return handleApiError(error);
  }
} 
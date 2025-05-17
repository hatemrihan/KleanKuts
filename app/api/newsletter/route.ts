import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Newsletter from '../../../models/Newsletter';
import { handleDatabaseError, handleApiError } from '../../utils/errorHandling';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate email
    if (!body.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }
    
    // Normalize email
    const email = body.email.toLowerCase().trim();
    const source = body.source || 'website_footer';
    
    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({ email });
    
    if (existingSubscription) {
      // If already subscribed, just return success
      if (existingSubscription.subscribed) {
        return NextResponse.json(
          { message: 'Already subscribed', success: true },
          { status: 200 }
        );
      }
      
      // If previously unsubscribed, resubscribe them
      existingSubscription.subscribed = true;
      existingSubscription.subscribedAt = new Date();
      await existingSubscription.save();
      
      return NextResponse.json(
        { message: 'Re-subscribed successfully', success: true },
        { status: 200 }
      );
    }
    
    // Create new subscription
    const subscription = await Newsletter.create({
      email,
      source,
      subscribed: true,
      subscribedAt: new Date()
    });
    
    return NextResponse.json(
      { message: 'Subscribed successfully', success: true },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error);
    
    // Check if it's a duplicate key error (MongoDB E11000)
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'Already subscribed', success: true },
        { status: 200 }
      );
    }
    
    // Check if it's a database connection error
    if (error.name?.includes('Mongo') || error.message?.includes('connect')) {
      return handleDatabaseError(error);
    }
    
    // Validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }
    
    // Other API errors
    return handleApiError(error);
  }
}

// Get a count of newsletter subscriptions (admin only)
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Get query parameters
    const url = new URL(req.url);
    const source = url.searchParams.get('source');
    
    // Build query
    const query: any = { subscribed: true };
    
    // Filter by source if provided
    if (source) {
      query.source = source;
    }
    
    // Count subscriptions
    const count = await Newsletter.countDocuments(query);
    
    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error counting newsletter subscriptions:', error);
    
    // Check if it's a database connection error
    if (error.name?.includes('Mongo') || error.message?.includes('connect')) {
      return handleDatabaseError(error);
    }
    
    // Other API errors
    return handleApiError(error);
  }
} 
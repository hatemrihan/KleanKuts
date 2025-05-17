import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Newsletter from '../../../../models/Newsletter';
import { handleDatabaseError, handleApiError } from '../../../utils/errorHandling';

// Get all subscribers (paginated)
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const source = url.searchParams.get('source');
    const subscribed = url.searchParams.get('subscribed');
    const search = url.searchParams.get('search');
    
    // Build query
    const query: any = {};
    
    // Filter by source if provided
    if (source) {
      query.source = source;
    }
    
    // Filter by subscription status if provided
    if (subscribed !== null) {
      query.subscribed = subscribed === 'true';
    }
    
    // Add search filter if provided
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get subscribers with pagination
    const subscribers = await Newsletter.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Newsletter.countDocuments(query);
    
    return NextResponse.json({
      subscribers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching newsletter subscribers:', error);
    
    // Check if it's a database connection error
    if (error.name?.includes('Mongo') || error.message?.includes('connect')) {
      return handleDatabaseError(error);
    }
    
    // Other API errors
    return handleApiError(error);
  }
}

// Export subscribers as CSV
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const format = body.format || 'json';
    const source = body.source;
    const subscribed = body.subscribed !== undefined ? body.subscribed : true;
    
    // Build query
    const query: any = { subscribed };
    
    // Filter by source if provided
    if (source) {
      query.source = source;
    }
    
    // Get all subscribers
    const subscribers = await Newsletter.find(query).sort({ createdAt: -1 });
    
    if (format === 'csv') {
      // Format as CSV
      const csvHeaders = 'Email,Source,Subscribed,SubscribedAt,CreatedAt\n';
      const csvRows = subscribers.map(sub => {
        return `${sub.email},${sub.source},${sub.subscribed},${sub.subscribedAt},${sub.createdAt}`;
      }).join('\n');
      
      const csv = csvHeaders + csvRows;
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=newsletter_subscribers.csv'
        }
      });
    }
    
    // Default to JSON
    return NextResponse.json({ subscribers });
  } catch (error: any) {
    console.error('Error exporting newsletter subscribers:', error);
    
    // Check if it's a database connection error
    if (error.name?.includes('Mongo') || error.message?.includes('connect')) {
      return handleDatabaseError(error);
    }
    
    // Other API errors
    return handleApiError(error);
  }
} 
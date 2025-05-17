import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/category';
import { setCorsHeaders, corsOptions } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    // Get CORS headers from our utility
    const headers = setCorsHeaders(request);
    
    // Add caching headers
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    
    await dbConnect();
    
    // Only fetch active categories
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    
    // Log the categories for debugging
    console.log(`API: Returning ${categories.length} categories`);
    if (categories.length > 0) {
      console.log('First category data:', JSON.stringify({
        name: categories[0].name,
        images: categories[0].images
      }));
    }
    
    return NextResponse.json(categories, { headers });
  } catch (error) {
    console.error('Error fetching storefront categories:', error);
    
    // Get CORS headers for error response
    const headers = setCorsHeaders(request);
    
    return NextResponse.json(
      { error: 'Failed to fetch storefront categories' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request: Request) {
  // Use the utility function for CORS preflight
  return corsOptions(request);
} 
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/category';

export async function GET(request: Request) {
  try {
    // Configure CORS
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://elevee.netlify.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    const headers = new Headers();
    
    // Add CORS headers if the origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', 'GET');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    await dbConnect();
    
    // Only fetch active categories
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    
    return NextResponse.json(categories, { headers });
  } catch (error) {
    console.error('Error fetching storefront categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storefront categories' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  // Handle OPTIONS request for CORS preflight
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://elevee.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  const headers = new Headers();
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  return new NextResponse(null, { status: 204, headers });
} 
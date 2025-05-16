import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/category';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Parse query parameters
    const url = new URL(request.url);
    const isActiveParam = url.searchParams.get('isActive');
    
    // Build query
    const query: any = {};
    
    // Only filter by isActive if the parameter exists
    if (isActiveParam !== null) {
      query.isActive = isActiveParam === 'true';
    }
    
    // Fetch categories
    const categories = await Category.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 
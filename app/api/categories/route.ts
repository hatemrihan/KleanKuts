import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/category';
import { handleApiError } from '../../utils/errorHandling';

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

// Proxy API to fetch categories from the admin server
export async function GETProxy() {
  try {
    console.log('Proxy API: Fetching categories from admin');
    
    // Fetch from the admin server
    const response = await fetch('https://eleveadmin.netlify.app/api/storefront/categories', {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Admin API error:', {
        status: response.status,
        statusText: response.statusText
      });
      
      throw new Error(`Admin API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Proxy API: Successfully fetched ${data.length} categories`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy API error when fetching categories:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories from admin', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
} 
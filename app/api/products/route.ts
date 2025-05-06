import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Product from '../../../models/Product';
import { handleDatabaseError, handleApiError } from '../../utils/errorHandling';

// Get all products
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Parse query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
    
    // Build query
    const query: any = { deleted: { $ne: true } };
    if (category) {
      query.categories = { $in: [category] };
    }
    
    // Execute query
    let productsQuery = Product.find(query).sort({ createdAt: -1 });
    if (limit) {
      productsQuery = productsQuery.limit(limit);
    }
    
    const products = await productsQuery.exec();
    
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    
    // Check if it's a database connection error
    if (error.name?.includes('Mongo') || error.message?.includes('connect')) {
      return handleDatabaseError(error);
    }
    
    // Other API errors
    return handleApiError(error);
  }
}

// Create a new product
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Product title is required' },
        { status: 400 }
      );
    }
    
    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
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

import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Product from '../../../models/Product';
import { handleDatabaseError, handleApiError } from '../../utils/errorHandling';
import { normalizeProductFields, ensureCloudinaryImages } from '../../../lib/adminIntegration';

// Get all products
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Parse query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
    const featured = url.searchParams.get('featured') === 'true';
    const exclude = url.searchParams.get('exclude');
    
    // Build query
    const query: any = { deleted: { $ne: true } };
    
    // Add category filter if provided
    if (category) {
      query.categories = { $in: [category] };
    }
    
    // Add featured filter if requested
    if (featured) {
      query.featured = true;
    }
    
    // Exclude specific product if requested
    if (exclude) {
      query._id = { $ne: exclude };
    }
    
    // Execute query
    let productsQuery = Product.find(query).sort({ createdAt: -1 });
    if (limit) {
      productsQuery = productsQuery.limit(limit);
    }
    
    const products = await productsQuery.exec();
    
    // Normalize product fields to ensure compatibility with admin panel
    const normalizedProducts = products.map(product => {
      const normalizedProduct = normalizeProductFields(product.toObject());
      return ensureCloudinaryImages(normalizedProduct);
    });
    
    return NextResponse.json(normalizedProducts);
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
    if (!body.title && !body.name) {
      return NextResponse.json(
        { error: 'Product title or name is required' },
        { status: 400 }
      );
    }
    
    // Normalize the product fields
    const normalizedBody = normalizeProductFields(body);
    
    // Ensure Cloudinary URLs for images
    const finalBody = ensureCloudinaryImages(normalizedBody);
    
    const product = await Product.create(finalBody);
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

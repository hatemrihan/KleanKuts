import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

// Cache for last update timestamps
const productUpdateTimestamps: Record<string, number> = {};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const lastUpdate = url.searchParams.get('lastUpdate');
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Convert lastUpdate to number or use 0 as default
    const lastUpdateTime = lastUpdate ? parseInt(lastUpdate, 10) : 0;
    
    // Check if there's a newer update available
    const lastKnownUpdate = productUpdateTimestamps[productId] || 0;
    
    // If client has the latest data already, return a 304 Not Modified
    if (lastUpdateTime >= lastKnownUpdate && lastUpdateTime > 0) {
      return new Response(null, { status: 304 });
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Try to find the product by MongoDB ObjectId first
    let product;
    try {
      product = await productsCollection.findOne({ _id: new ObjectId(productId) });
    } catch (error) {
      // If the ID is not a valid ObjectId, try to find by custom ID field
      product = await productsCollection.findOne({ id: productId });
    }
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Extract only the stock-related information to keep the response small
    const stockInfo = {
      _id: product._id,
      sizeVariants: product.sizeVariants || [],
      sizes: product.sizes || [],
      success: true,
      timestamp: Date.now()
    };
    
    // Update the timestamp cache
    productUpdateTimestamps[productId] = stockInfo.timestamp;
    
    // Set cache control headers to prevent caching
    return new Response(JSON.stringify(stockInfo), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching product stock:', error);
    return NextResponse.json(
      { success: false, message: `Error fetching product stock: ${error.message}` },
      { status: 500 }
    );
  }
}

// When stock is reduced, call this function to update the timestamp
export async function POST(request: Request) {
  try {
    const { productId } = await request.json();
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Update the timestamp for this product
    productUpdateTimestamps[productId] = Date.now();
    
    return NextResponse.json({
      success: true,
      message: 'Stock update notification sent',
      timestamp: productUpdateTimestamps[productId]
    });
    
  } catch (error: any) {
    console.error('Error updating stock timestamp:', error);
    return NextResponse.json(
      { success: false, message: `Error updating stock timestamp: ${error.message}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';
import { ObjectId } from 'mongodb';
import { isProductBlacklisted, BLACKLISTED_PRODUCT_IDS } from '@/app/utils/productBlacklist';

/**
 * POST /api/products/blacklist/validate
 * Validates a list of product IDs against the database and blacklist
 * Request body: { productIds: string[] }
 * Response: { valid: string[], blacklisted: string[], missingOrDeleted: string[] }
 */
export async function POST(request: Request) {
  try {
    const { productIds } = await request.json();
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request: productIds array is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Initialize result arrays
    const valid: string[] = [];
    const blacklisted: string[] = [];
    const missingOrDeleted: string[] = [];
    
    // Process each product ID
    for (const productId of productIds) {
      // First check if the product is blacklisted
      if (isProductBlacklisted(productId)) {
        blacklisted.push(productId);
        continue;
      }
      
      // Then check if the product exists in the database
      try {
        const objectId = new ObjectId(productId);
        const product = await productsCollection.findOne({ _id: objectId });
        
        if (product) {
          valid.push(productId);
        } else {
          missingOrDeleted.push(productId);
        }
      } catch (error) {
        // If the ID is not a valid ObjectId, consider it missing
        missingOrDeleted.push(productId);
      }
    }
    
    return NextResponse.json({
      success: true,
      valid,
      blacklisted,
      missingOrDeleted
    });
    
  } catch (error: any) {
    console.error('Error validating products:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to validate products' },
      { status: 500 }
    );
  }
}

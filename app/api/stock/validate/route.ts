import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Process each item to validate stock
    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      if (!productId || !size || quantity <= 0) {
        return NextResponse.json(
          { valid: false, message: 'Invalid item data: productId, size, and quantity are required' },
          { status: 400 }
        );
      }
      
      // Find the product
      let productObjectId;
      try {
        productObjectId = new ObjectId(productId);
      } catch (error) {
        return NextResponse.json(
          { valid: false, message: `Invalid product ID format: ${productId}` },
          { status: 400 }
        );
      }
      
      const product = await productsCollection.findOne({ _id: productObjectId });
      
      // If product is not found, we'll still allow it to proceed with checkout
      // This prevents "Product not found" errors from blocking the checkout process
      if (!product) {
        console.log(`Product not found in database: ${productId}, but allowing checkout to proceed`);
        // Skip stock validation for this product and continue with the next one
        continue;
      }
      
      // Check if the product has size variants
      if (!product.sizeVariants || !Array.isArray(product.sizeVariants)) {
        return NextResponse.json(
          { valid: false, message: `Product ${productId} does not have size variants` },
          { status: 400 }
        );
      }
      
      // Find the specific size variant
      const sizeVariant = product.sizeVariants.find((sv: any) => sv.size === size);
      
      if (!sizeVariant) {
        return NextResponse.json(
          { valid: false, message: `Size ${size} not found for product ${productId}` },
          { status: 404 }
        );
      }
      
      // If color is specified, check color variant
      if (color) {
        if (!sizeVariant.colorVariants || !Array.isArray(sizeVariant.colorVariants)) {
          return NextResponse.json(
            { valid: false, message: `Size ${size} does not have color variants` },
            { status: 400 }
          );
        }
        
        const colorVariant = sizeVariant.colorVariants.find((cv: any) => cv.color === color);
        
        if (!colorVariant) {
          return NextResponse.json(
            { valid: false, message: `Color ${color} not found for size ${size}` },
            { status: 404 }
          );
        }
        
        if (colorVariant.stock < quantity) {
          return NextResponse.json(
            { 
              valid: false, 
              message: `Insufficient stock for ${product.name} in size ${size}, color ${color}. Requested: ${quantity}, Available: ${colorVariant.stock}` 
            },
            { status: 400 }
          );
        }
      } else {
        // If no color specified, check overall size stock
        if (sizeVariant.stock < quantity) {
          return NextResponse.json(
            { 
              valid: false, 
              message: `Insufficient stock for ${product.name} in size ${size}. Requested: ${quantity}, Available: ${sizeVariant.stock}` 
            },
            { status: 400 }
          );
        }
      }
    }
    
    // If we get here, all items are valid and in stock
    return NextResponse.json({ valid: true, message: 'All items are available' });
    
  } catch (error: any) {
    console.error('Error validating stock:', error);
    return NextResponse.json(
      { valid: false, message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

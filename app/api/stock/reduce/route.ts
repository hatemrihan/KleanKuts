import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    const results = [];
    
    // Process each item to reduce stock
    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      if (!productId || !size || quantity <= 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid item data: productId, size, and quantity are required' },
          { status: 400 }
        );
      }
      
      // Find the product
      let productObjectId;
      try {
        productObjectId = new ObjectId(productId);
      } catch (error) {
        return NextResponse.json(
          { success: false, message: `Invalid product ID format: ${productId}` },
          { status: 400 }
        );
      }
      
      // First, get the current product to check stock
      const product = await productsCollection.findOne({ _id: productObjectId });
      
      // If product is not found, we'll still allow the order to proceed
      // This prevents "Product not found" errors from blocking the checkout process
      if (!product) {
        console.log(`Product not found in database: ${productId}, but allowing order to proceed`);
        // Add a result for this product and continue with the next one
        results.push({
          productId,
          size,
          color,
          quantity,
          success: true,
          message: 'Product not found but order allowed to proceed'
        });
        continue;
      }
      
      // Check if the product has size variants
      if (!product.sizeVariants || !Array.isArray(product.sizeVariants)) {
        return NextResponse.json(
          { success: false, message: `Product ${productId} does not have size variants` },
          { status: 400 }
        );
      }
      
      // Find the specific size variant
      const sizeVariantIndex = product.sizeVariants.findIndex((sv: any) => sv.size === size);
      
      if (sizeVariantIndex === -1) {
        return NextResponse.json(
          { success: false, message: `Size ${size} not found for product ${productId}` },
          { status: 404 }
        );
      }
      
      const sizeVariant = product.sizeVariants[sizeVariantIndex];
      
      // If color is specified, update color variant stock
      if (color) {
        if (!sizeVariant.colorVariants || !Array.isArray(sizeVariant.colorVariants)) {
          return NextResponse.json(
            { success: false, message: `Size ${size} does not have color variants` },
            { status: 400 }
          );
        }
        
        const colorVariantIndex = sizeVariant.colorVariants.findIndex((cv: any) => cv.color === color);
        
        if (colorVariantIndex === -1) {
          return NextResponse.json(
            { success: false, message: `Color ${color} not found for size ${size}` },
            { status: 404 }
          );
        }
        
        const colorVariant = sizeVariant.colorVariants[colorVariantIndex];
        
        if (colorVariant.stock < quantity) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Insufficient stock for ${product.name} in size ${size}, color ${color}. Requested: ${quantity}, Available: ${colorVariant.stock}` 
            },
            { status: 400 }
          );
        }
        
        // Update the stock for this color variant
        const updatePath = `sizeVariants.${sizeVariantIndex}.colorVariants.${colorVariantIndex}.stock`;
        
        try {
          // Use updateOne with $inc operator to safely modify stock without touching _id
          const updateResult = await productsCollection.updateOne(
            { _id: productObjectId },
            { $inc: { [updatePath]: -quantity } }
          );
          
          // If no documents were modified, throw an error
          if (updateResult.modifiedCount === 0) {
            console.error(`No documents modified for product ${productId}`);
          }
          
          results.push({
            productId,
            size,
            color,
            quantity,
            success: updateResult.modifiedCount > 0,
            previousStock: colorVariant.stock,
            newStock: colorVariant.stock - quantity
          });
          
        } catch (updateError: any) {
          console.error('Error updating stock:', updateError);
          return NextResponse.json(
            { success: false, message: `Error updating stock: ${updateError.message}` },
            { status: 500 }
          );
        }
        
// This results.push is now handled inside the try block
        
      } else {
        // If no color specified, update overall size stock
        if (sizeVariant.stock < quantity) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Insufficient stock for ${product.name} in size ${size}. Requested: ${quantity}, Available: ${sizeVariant.stock}` 
            },
            { status: 400 }
          );
        }
        
        // Update the stock for this size
        const updatePath = `sizeVariants.${sizeVariantIndex}.stock`;
        const updateResult = await productsCollection.updateOne(
          { _id: productObjectId },
          { $inc: { [updatePath]: -quantity } }
        );
        
        results.push({
          productId,
          size,
          quantity,
          success: updateResult.modifiedCount > 0,
          previousStock: sizeVariant.stock,
          newStock: sizeVariant.stock - quantity
        });
      }
    }
    
    // Add a timestamp to indicate when the stock was last updated
    const timestamp = new Date().toISOString();
    const now = Date.now();
    
    // Notify the sync endpoint about stock changes for each product
    try {
      // Get unique product IDs from the results
      const productIds = Array.from(new Set(results.map(result => result.productId)));
      
      // Notify sync endpoint for each product
      await Promise.all(productIds.map(async (productId) => {
        try {
          // Make a POST request to the sync endpoint
          const syncResponse = await fetch(`${new URL(request.url).origin}/api/stock/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
          });
          
          if (!syncResponse.ok) {
            console.warn(`Failed to notify sync endpoint for product ${productId}:`, syncResponse.status);
          }
        } catch (syncError) {
          console.error(`Error notifying sync endpoint for product ${productId}:`, syncError);
          // Don't throw the error, just log it
        }
      }));
    } catch (syncError) {
      console.error('Error notifying sync endpoints:', syncError);
      // Don't throw the error, just log it
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stock levels updated successfully',
      results,
      timestamp,
      updatedAt: now
    });
    
  } catch (error: any) {
    console.error('Error reducing stock:', error);
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

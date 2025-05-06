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
      
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${productId}` },
          { status: 404 }
        );
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
        const updateResult = await productsCollection.updateOne(
          { _id: productObjectId },
          { $inc: { [updatePath]: -quantity } }
        );
        
        results.push({
          productId,
          size,
          color,
          quantity,
          success: updateResult.modifiedCount > 0,
          previousStock: colorVariant.stock,
          newStock: colorVariant.stock - quantity
        });
        
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stock levels updated successfully',
      results
    });
    
  } catch (error: any) {
    console.error('Error reducing stock:', error);
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

// POST endpoint to reduce inventory for a specific product variant
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const productId = params.id;
    const body = await request.json();
    
    // Validate request body
    if (!body.size || !body.color || typeof body.quantity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Size, color and quantity are required' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Initialize inventory if it doesn't exist
    if (!product.inventory) {
      product.inventory = {
        total: 0,
        variants: []
      };
    }
    
    // Find the variant
    const variantIndex = product.inventory.variants.findIndex(
      (v: { size: string; color: string }) => v.size === body.size && v.color === body.color
    );
    
    if (variantIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }
    
    // Update quantity
    const currentQty = product.inventory.variants[variantIndex].quantity;
    const deductQty = Math.min(currentQty, body.quantity);
    const newQty = Math.max(0, currentQty - deductQty);
    
    // Update variant quantity
    product.inventory.variants[variantIndex].quantity = newQty;
    
    // Recalculate total
    product.inventory.total = product.inventory.variants.reduce(
      (sum: number, v: { quantity: number }) => sum + v.quantity, 0
    );
    
    await product.save();
    
    return NextResponse.json({
      success: true,
      message: 'Inventory reduced successfully',
      quantityReduced: deductQty,
      inventory: {
        total: product.inventory.total,
        variant: {
          size: body.size,
          color: body.color,
          quantity: newQty
        }
      }
    });
  } catch (error) {
    console.error('Error reducing product inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reduce inventory' },
      { status: 500 }
    );
  }
} 
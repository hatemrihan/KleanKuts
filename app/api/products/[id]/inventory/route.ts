import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

// GET endpoint to retrieve inventory status for a specific product
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const productId = params.id;
    
    const product = await Product.findById(productId).select('inventory');
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      inventory: product.inventory || { total: 0, variants: [] } 
    });
  } catch (error) {
    console.error('Error retrieving product inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve inventory data' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update product inventory
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const productId = params.id;
    const body = await request.json();
    
    if (!body.inventory) {
      return NextResponse.json(
        { success: false, error: 'Inventory data required' },
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
    
    // Update inventory
    product.inventory = body.inventory;
    
    await product.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Inventory updated successfully',
      inventory: product.inventory
    });
  } catch (error) {
    console.error('Error updating product inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory data' },
      { status: 500 }
    );
  }
} 
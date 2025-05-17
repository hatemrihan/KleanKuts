import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

// POST endpoint to update a specific order item
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const orderId = params.id;
    const body = await request.json();
    
    // Validate request body
    if (!body.productId || !body.size || !body.updates) {
      return NextResponse.json(
        { success: false, error: 'Product ID, size and updates are required' },
        { status: 400 }
      );
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Find the item in the order
    const itemIndex = order.products.findIndex((item: any) => 
      item.productId === body.productId && 
      item.size === body.size && 
      (body.color ? item.color === body.color : true)
    );
    
    if (itemIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Order item not found' },
        { status: 404 }
      );
    }
    
    // Update the item with the provided updates
    Object.keys(body.updates).forEach(key => {
      order.products[itemIndex][key] = body.updates[key];
    });
    
    await order.save();
    
    return NextResponse.json({
      success: true,
      message: 'Order item updated successfully',
      item: order.products[itemIndex]
    });
  } catch (error) {
    console.error('Error updating order item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order item' },
      { status: 500 }
    );
  }
} 
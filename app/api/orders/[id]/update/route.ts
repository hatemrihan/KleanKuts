import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const orderId = params.id;
    const body = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
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
    
    // Update allowed fields
    if (body.status !== undefined) {
      order.status = body.status;
    }
    
    if (body.inventoryProcessed !== undefined) {
      order.inventoryProcessed = body.inventoryProcessed;
    }
    
    await order.save();
    
    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
} 
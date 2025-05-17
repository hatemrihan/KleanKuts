import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST() {
  try {
    await dbConnect();
    
    // Find orders that haven't been processed for inventory
    const unprocessedOrders = await Order.find({
      inventoryProcessed: { $ne: true }
    }).sort({ createdAt: 1 });
    
    if (unprocessedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed orders found',
        processed: 0
      });
    }
    
    const results = [];
    
    // Process each order by calling the update-from-order endpoint
    for (const order of unprocessedOrders) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app'}/api/inventory/update-from-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ orderId: order._id })
        });
        
        const result = await response.json();
        
        results.push({
          orderId: order._id,
          success: result.success,
          message: result.message,
          updates: result.updates ? result.updates.length : 0
        });
      } catch (error) {
        console.error(`Error processing order ${order._id}:`, error);
        results.push({
          orderId: order._id,
          success: false,
          message: 'Failed to process'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Inventory synchronization completed',
      processed: results.length,
      results: results
    });
  } catch (error) {
    console.error('Error synchronizing inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to synchronize inventory' },
      { status: 500 }
    );
  }
} 
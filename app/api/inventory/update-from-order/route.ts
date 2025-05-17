import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function POST(request: Request) {
  try {
    console.log('🔄 Starting inventory update from order API');
    await dbConnect();
    const body = await request.json();
    
    // Validate request body
    if (!body.orderId) {
      console.error('❌ Order ID missing in request');
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`📋 Looking up order: ${body.orderId}`);
    const order = await Order.findById(body.orderId);
    
    if (!order) {
      console.error(`❌ Order not found: ${body.orderId}`);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Skip if inventory was already processed
    if (order.inventoryProcessed) {
      console.log(`⏭️ Order ${body.orderId} already processed`);
      return NextResponse.json({ 
        success: true, 
        message: 'Inventory already processed for this order',
        order: order
      });
    }

    console.log(`🔍 Processing inventory for order ${body.orderId} with ${order.products.length} products`);
    const updateResults = [];
    
    // Process each product in the order
    for (const item of order.products) {
      // Skip if already updated
      if (item.inventoryUpdated) {
        console.log(`⏭️ Skipping product ${item.productId}: already updated`);
        updateResults.push({
          productId: item.productId,
          status: 'skipped',
          message: 'Already updated'
        });
        continue;
      }
      
      try {
        // Find the product
        console.log(`🔍 Finding product: ${item.productId}`);
        const product = await Product.findById(item.productId);
        
        if (!product) {
          console.error(`❌ Product not found: ${item.productId}`);
          updateResults.push({
            productId: item.productId,
            status: 'error',
            message: 'Product not found'
          });
          continue;
        }
        
        // Initialize inventory if it doesn't exist
        if (!product.inventory) {
          console.log(`🔨 Initializing inventory for product ${item.productId}`);
          product.inventory = {
            total: 0,
            variants: []
          };
        }
        
        const itemColor = item.color || 'Default';
        console.log(`🔍 Looking for variant with size ${item.size} and color ${itemColor}`);
        
        // Find the variant
        const variant = product.inventory.variants.find(
          (v: any) => v.size === item.size && v.color === itemColor
        );
        
        if (!variant) {
          console.error(`❌ Variant not found for product ${item.productId}: ${item.size}/${itemColor}`);
          updateResults.push({
            productId: item.productId,
            status: 'error',
            message: `Variant not found: ${item.size}/${itemColor}`
          });
          continue;
        }
        
        // Update quantity
        const initialQty = variant.quantity;
        variant.quantity = Math.max(0, variant.quantity - item.quantity);
        
        console.log(`📉 Updating inventory for ${item.productId} from ${initialQty} to ${variant.quantity}`);
        
        // Recalculate total
        product.inventory.total = product.inventory.variants.reduce(
          (sum: number, v: any) => sum + v.quantity, 0
        );
        
        // Save the product
        await product.save();
        
        // Mark the item as updated
        item.inventoryUpdated = true;
        
        updateResults.push({
          productId: item.productId,
          status: 'success',
          from: initialQty,
          to: variant.quantity,
          deducted: initialQty - variant.quantity
        });
      } catch (error) {
        console.error(`❌ Error updating inventory for product ${item.productId}:`, error);
        updateResults.push({
          productId: item.productId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    }
    
    // Mark the order as processed
    order.inventoryProcessed = true;
    await order.save();
    
    console.log(`✅ Inventory update completed for order ${body.orderId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      updates: updateResults,
      order: order
    });
  } catch (error) {
    console.error('❌ Error updating inventory from order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update inventory',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
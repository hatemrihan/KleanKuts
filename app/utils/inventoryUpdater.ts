/**
 * Utility functions for updating product inventory after successful orders
 */

import { reduceStock } from './stockUtils';

/**
 * Updates inventory based on order ID
 * @param orderId - The ID of the order to update inventory for
 */
export async function updateInventory(orderId: string) {
  try {
    console.log('🔄 Starting inventory update for order:', orderId);
    
    // First, get the order details to know what products to update
    let orderData;
    try {
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) {
        throw new Error(`Failed to fetch order: ${orderResponse.status}`);
      }
      const data = await orderResponse.json();
      orderData = data.order;
      
      if (!orderData || !orderData.products || !Array.isArray(orderData.products)) {
        throw new Error('Invalid order data: missing products array');
      }
      
      console.log(`📦 Got order with ${orderData.products.length} product(s) to update`);
    } catch (orderError) {
      console.error('Error fetching order:', orderError);
      return { success: false, error: orderError };
    }
    
    // Skip if inventory was already processed
    if (orderData.inventoryProcessed) {
      console.log(`⏭️ Inventory already processed for order ${orderId}`);
      return { 
        success: true, 
        message: 'Inventory already processed for this order' 
      };
    }
    
    // USE THE WORKING STOCK REDUCTION METHOD
    // Format items for stock reduction
    const items = orderData.products.map((item: any) => ({
      productId: item.productId,
      size: item.size,
      color: item.color || 'Default',
      quantity: item.quantity || 1
    }));
    
    console.log('🔄 Using direct stock reduction method that was working in 2d25bd0');
    
    // Call the reduceStock function from stockUtils.ts which was working properly
    try {
      const stockResult = await reduceStock(items);
      console.log('✅ Stock reduction successful:', stockResult);
      
      // Mark the order as processed
      try {
        const updateResponse = await fetch(`/api/orders/${orderId}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventoryProcessed: true })
        });
        
        if (updateResponse.ok) {
          console.log('✅ Order marked as inventory processed');
        } else {
          console.warn('⚠️ Failed to mark order as processed, but stock was reduced');
        }
      } catch (updateError) {
        console.warn('⚠️ Error marking order as processed:', updateError);
        // Don't fail if just the marking fails
      }
      
      return { 
        success: true, 
        message: 'Stock reduction completed successfully',
        details: stockResult
      };
    } catch (stockError) {
      console.error('❌ Stock reduction failed:', stockError);
      
      // Store the failed update in localStorage for retry on thank-you page
      try {
        const pendingUpdates = JSON.parse(localStorage.getItem('pendingInventoryUpdates') || '[]');
        
        // Check if this order is already in pending updates
        const orderExists = pendingUpdates.some((update: any) => update.orderId === orderId);
        
        if (!orderExists) {
          pendingUpdates.push({
            orderId,
            timestamp: Date.now()
          });
          localStorage.setItem('pendingInventoryUpdates', JSON.stringify(pendingUpdates));
          console.log('📦 Saved pending inventory update for later retry', { orderId });
        }
      } catch (storageError) {
        console.error('Failed to store pending update in localStorage', storageError);
      }
      
      return { success: false, error: stockError };
    }
  } catch (error) {
    console.error('🔴 Error in inventory update process:', error);
    return { success: false, error };
  }
}

/**
 * Synchronizes inventory across all orders to fix any discrepancies
 */
export async function syncAllInventory() {
  try {
    // Call the inventory sync API
    const response = await fetch('/api/inventory/sync-all-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Inventory sync failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Inventory synchronized successfully:', data);
    return data;
  } catch (error) {
    console.error('Error synchronizing inventory:', error);
    return { success: false, error };
  }
} 
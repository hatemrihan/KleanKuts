/**
 * Utility functions for product inventory management
 */

/**
 * Fetch product details by ID
 */
export async function fetchProduct(productId: string) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`);
    }
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

/**
 * Update product inventory 
 */
export async function updateProductInventory(productId: string, inventory: any) {
  try {
    const response = await fetch(`/api/products/${productId}/inventory`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inventory }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update inventory: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating inventory for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Reduce inventory for a specific product variant
 */
export async function reduceVariantInventory(productId: string, size: string, color: string, quantity: number) {
  try {
    const response = await fetch(`/api/products/${productId}/reduce-inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ size, color, quantity }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reduce inventory: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error reducing inventory for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Update order item to mark inventory as updated
 */
export async function updateOrderItem(orderId: string, productId: string, size: string, color: string, updates: any) {
  try {
    const response = await fetch(`/api/orders/${orderId}/items/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        size,
        color,
        updates
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update order item: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating order item:`, error);
    throw error;
  }
}

/**
 * Main function to reduce inventory for an entire order
 */
export async function reduceInventory(order: any) {
  try {
    console.log('Reducing inventory for order:', order._id || order.orderId);
    
    // For each product in order
    for (const item of order.products) {
      // Skip if already processed
      if (item.inventoryUpdated) {
        console.log(`Inventory already updated for item: ${item.productId}, size: ${item.size}, color: ${item.color || 'default'}`);
        continue;
      }
      
      // Get current product details
      const product = await fetchProduct(item.productId);
      
      if (!product || !product.inventory) {
        console.log(`Product ${item.productId} not found or has no inventory data`);
        continue;
      }
      
      // Use the color if available, otherwise use 'default'
      const color = item.color || 'default';
      
      // Find the variant
      const variantIndex = product.inventory.variants.findIndex(
        (v: any) => v.size === item.size && v.color === color
      );
      
      if (variantIndex >= 0) {
        try {
          // Reduce inventory via the API
          await reduceVariantInventory(
            item.productId, 
            item.size, 
            color, 
            item.quantity
          );
          
          // Mark this item as updated in the order
          await updateOrderItem(
            order._id || order.orderId, 
            item.productId, 
            item.size, 
            color, 
            { inventoryUpdated: true }
          );
          
          console.log(`Successfully reduced inventory for ${item.productId}, size: ${item.size}, color: ${color}`);
        } catch (error) {
          console.error(`Failed to reduce inventory for item ${item.productId}:`, error);
        }
      } else {
        console.log(`Variant not found: ${item.productId}, size: ${item.size}, color: ${color}`);
      }
    }
    
    return { success: true, message: 'Inventory processing complete' };
  } catch (error) {
    console.error('Failed to reduce inventory:', error);
    return { success: false, error: 'Failed to reduce inventory' };
  }
} 
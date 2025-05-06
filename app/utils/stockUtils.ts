/**
 * Utility functions for stock management
 */

/**
 * Validates that all items in the cart have sufficient stock
 * @param cartItems Array of cart items to validate
 * @returns Promise resolving to validation result
 */
export async function validateStock(cartItems: any[]) {
  try {
    const response = await fetch('/api/stock/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: cartItems }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to validate stock');
    }
    
    return data;
  } catch (error) {
    console.error('Stock validation error:', error);
    throw error;
  }
}

/**
 * Reduces stock levels after an order is placed
 * @param orderItems Array of ordered items
 * @returns Promise resolving to stock update result
 */
export async function reduceStock(orderItems: any[]) {
  try {
    const response = await fetch('/api/stock/reduce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: orderItems }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update stock');
    }
    
    return data;
  } catch (error) {
    console.error('Stock reduction error:', error);
    throw error;
  }
}

/**
 * Formats stock information for display
 * @param stock Stock quantity
 * @returns Formatted stock message
 */
export function formatStockMessage(stock: number): string {
  if (stock <= 0) {
    return 'Out of stock';
  } else if (stock <= 5) {
    return `Only ${stock} left!`;
  } else {
    return `${stock} in stock`;
  }
}

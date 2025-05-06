/**
 * Utility functions for inventory management
 */

import axios from 'axios';

interface InventoryUpdateItem {
  productId: string;
  size: string;
  color?: string;
  quantity: number;
}

/**
 * Updates inventory for products after a purchase
 * @param items Array of items to update inventory for
 * @returns Promise that resolves when inventory is updated
 */
export const updateInventoryAfterPurchase = async (items: InventoryUpdateItem[]): Promise<boolean> => {
  try {
    const response = await axios.post('/api/inventory/sync', { items });
    return response.status === 200;
  } catch (error) {
    console.error('Error updating inventory:', error);
    return false;
  }
};

/**
 * Checks if a product is in stock with the specified size and color
 * @param productId Product ID
 * @param size Size variant
 * @param color Color variant (optional)
 * @param quantity Quantity to check
 * @returns Promise that resolves to a boolean indicating if the product is in stock
 */
export const checkProductStock = async (
  productId: string,
  size: string,
  color?: string,
  quantity: number = 1
): Promise<boolean> => {
  try {
    const response = await axios.get(`/api/products/inventory`, {
      params: { productId, size, color, quantity }
    });
    
    return response.data.inStock;
  } catch (error) {
    console.error('Error checking product stock:', error);
    // Default to true to prevent blocking purchases if the API fails
    return true;
  }
};

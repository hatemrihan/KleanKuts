/**
 * Utility functions for cart management
 */

/**
 * Validates that a product exists in the database
 * @param productId Product ID to validate
 * @returns Promise resolving to a boolean indicating if the product exists
 */
export async function validateProductExists(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/products/${productId}`);
    return response.ok;
  } catch (error) {
    console.error(`Error validating product ${productId}:`, error);
    return false;
  }
}

/**
 * Cleans the cart by removing any products that no longer exist in the database
 * @param cart Array of cart items
 * @returns Promise resolving to a cleaned cart array
 */
export async function cleanCart(cart: any[]): Promise<any[]> {
  if (!cart || cart.length === 0) return [];
  
  const validatedCart = [];
  const invalidProductIds = [];
  
  // Check each product in the cart
  for (const item of cart) {
    const exists = await validateProductExists(item.id);
    if (exists) {
      validatedCart.push(item);
    } else {
      invalidProductIds.push(item.id);
    }
  }
  
  // Log any invalid products that were removed
  if (invalidProductIds.length > 0) {
    console.warn('Removed invalid products from cart:', invalidProductIds);
  }
  
  return validatedCart;
}

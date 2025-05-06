/**
 * List of problematic product IDs that should be automatically removed from cart
 * This centralized list makes it easy to update when new problematic IDs are found
 */

export const BLACKLISTED_PRODUCT_IDS = [
  '6819b110064b2eeffa2c1941',  // Original problematic ID
  '6819a258828e01d7e7d17e95',  // Second problematic ID
  // Add any other problematic IDs here
];

/**
 * Checks if a product ID is blacklisted
 * @param productId Product ID to check
 * @returns Boolean indicating if the product is blacklisted
 */
export function isProductBlacklisted(productId: string): boolean {
  return BLACKLISTED_PRODUCT_IDS.includes(productId);
}

/**
 * Filters out blacklisted products from a cart array
 * @param cart Array of cart items
 * @returns Filtered cart array with blacklisted products removed
 */
export function removeBlacklistedProducts<T extends { id: string }>(cart: T[]): T[] {
  return cart.filter(item => !isProductBlacklisted(item.id));
}

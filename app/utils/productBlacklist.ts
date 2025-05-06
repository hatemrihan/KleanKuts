/**
 * Product Blacklist System
 * 
 * This module provides utilities for managing a blacklist of product IDs
 * that should be automatically removed from carts. This is useful for
 * handling products that have been deleted from the database but might
 * still exist in user carts.
 * 
 * NOTE: This version is client-compatible and doesn't import MongoDB directly.
 * Server-side operations are handled through API endpoints.
 */

'use client';

// In-memory blacklist (initial values)
export const BLACKLISTED_PRODUCT_IDS = [
  '6819b110064b2eeffa2c1941',  // Original problematic ID
  '6819a258828e01d7e7d17e95',  // Second problematic ID
  '681a4def311e3be5855f56aa',  // Third problematic ID from user's screenshot
  // Add any other problematic IDs here
];

// API endpoints for blacklist operations
const BLACKLIST_API = {
  ADD: '/api/products/blacklist/add',
  REMOVE: '/api/products/blacklist/remove',
  LOAD: '/api/products/blacklist/load',
  DETAILS: '/api/products/blacklist/details',
  VALIDATE: '/api/products/blacklist/validate'
};

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

/**
 * Adds a product ID to the blacklist
 * @param productId Product ID to blacklist
 * @param reason Optional reason for blacklisting
 * @returns Promise resolving to boolean indicating success
 */
export async function addToBlacklist(productId: string, reason: string = 'Product deleted'): Promise<boolean> {
  try {
    if (isProductBlacklisted(productId)) {
      return true; // Already blacklisted
    }
    
    // Update in-memory blacklist immediately
    BLACKLISTED_PRODUCT_IDS.push(productId);
    
    // Call the API to update the database blacklist
    const response = await fetch(BLACKLIST_API.ADD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId,
        reason
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error adding product to blacklist:', error);
    return false;
  }
}

/**
 * Loads the blacklist from the database via API
 * @returns Promise resolving to boolean indicating success
 */
export async function loadBlacklistFromDatabase(): Promise<boolean> {
  try {
    // Call the API to load the blacklist
    const response = await fetch(BLACKLIST_API.LOAD);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.blacklist)) {
      // Reset the in-memory blacklist
      BLACKLISTED_PRODUCT_IDS.length = 0;
      
      // Add all blacklisted product IDs from the API
      data.blacklist.forEach((productId: string) => {
        BLACKLISTED_PRODUCT_IDS.push(productId);
      });
      
      return true;
    } else {
      // If API fails, use the default problematic IDs
      BLACKLISTED_PRODUCT_IDS.length = 0;
      BLACKLISTED_PRODUCT_IDS.push(
        '6819b110064b2eeffa2c1941',
        '6819a258828e01d7e7d17e95',
        '681a4def311e3be5855f56aa',
        '681a5092498f3fc2f026f310'
      );
      return false;
    }
  } catch (error) {
    console.error('Error loading blacklist from database:', error);
    // If API call fails, use the default problematic IDs
    BLACKLISTED_PRODUCT_IDS.length = 0;
    BLACKLISTED_PRODUCT_IDS.push(
      '6819b110064b2eeffa2c1941',
      '6819a258828e01d7e7d17e95',
      '681a4def311e3be5855f56aa',
      '681a5092498f3fc2f026f310'
    );
    return false;
  }
}

/**
 * Removes a product ID from the blacklist
 * @param productId Product ID to remove from blacklist
 * @returns Promise resolving to boolean indicating success
 */
export async function removeFromBlacklist(productId: string): Promise<boolean> {
  try {
    // Update in-memory blacklist immediately
    const index = BLACKLISTED_PRODUCT_IDS.indexOf(productId);
    if (index !== -1) {
      BLACKLISTED_PRODUCT_IDS.splice(index, 1);
    }
    
    // Call the API to update the database blacklist
    const response = await fetch(BLACKLIST_API.REMOVE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error removing product from blacklist:', error);
    return false;
  }
}

/**
 * Gets detailed information about blacklisted products
 * @returns Promise resolving to an array of blacklisted product details
 */
export async function getBlacklistWithDetails(): Promise<any[]> {
  try {
    // Call the API to get detailed blacklist information
    const response = await fetch(BLACKLIST_API.DETAILS);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.blacklist)) {
      return data.blacklist;
    } else {
      console.error('Failed to get blacklist details from API');
      return [];
    }
  } catch (error) {
    console.error('Error getting blacklist with details:', error);
    return [];
  }
}

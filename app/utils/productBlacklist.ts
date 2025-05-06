/**
 * Product Blacklist System
 * 
 * This module provides utilities for managing a blacklist of product IDs
 * that should be automatically removed from carts. This is useful for
 * handling products that have been deleted from the database but might
 * still exist in user carts.
 */

import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

// In-memory blacklist (initial values)
export const BLACKLISTED_PRODUCT_IDS = [
  '6819b110064b2eeffa2c1941',  // Original problematic ID
  '6819a258828e01d7e7d17e95',  // Second problematic ID
  '681a4def311e3be5855f56aa',  // Third problematic ID from user's screenshot
  // Add any other problematic IDs here
];

// Database collection name for persistent storage
const BLACKLIST_COLLECTION = 'product_blacklist';

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
    
    // Update in-memory blacklist
    BLACKLISTED_PRODUCT_IDS.push(productId);
    
    // Update database blacklist
    const { db } = await connectToDatabase();
    const blacklistCollection = db.collection(BLACKLIST_COLLECTION);
    
    await blacklistCollection.insertOne({
      productId,
      reason,
      blacklistedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error adding product to blacklist:', error);
    return false;
  }
}

/**
 * Loads the blacklist from the database
 * @returns Promise resolving to boolean indicating success
 */
export async function loadBlacklistFromDatabase(): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();
    const blacklistCollection = db.collection(BLACKLIST_COLLECTION);
    
    const blacklistItems = await blacklistCollection.find({}).toArray();
    
    // Reset the in-memory blacklist with the initial values
    BLACKLISTED_PRODUCT_IDS.length = 0;
    BLACKLISTED_PRODUCT_IDS.push('6819b110064b2eeffa2c1941', '6819a258828e01d7e7d17e95');
    
    // Add all blacklisted product IDs from the database
    blacklistItems.forEach(item => {
      if (!BLACKLISTED_PRODUCT_IDS.includes(item.productId)) {
        BLACKLISTED_PRODUCT_IDS.push(item.productId);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error loading blacklist from database:', error);
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
    // Update in-memory blacklist
    const index = BLACKLISTED_PRODUCT_IDS.indexOf(productId);
    if (index !== -1) {
      BLACKLISTED_PRODUCT_IDS.splice(index, 1);
    }
    
    // Update database blacklist
    const { db } = await connectToDatabase();
    const blacklistCollection = db.collection(BLACKLIST_COLLECTION);
    
    await blacklistCollection.deleteOne({ productId });
    
    return true;
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
    const { db } = await connectToDatabase();
    const blacklistCollection = db.collection(BLACKLIST_COLLECTION);
    const productsCollection = db.collection('products');
    
    // Get all blacklisted products
    const blacklistedProducts = await blacklistCollection.find({}).toArray();
    
    // Enhance with product details where available
    const enhancedBlacklist = await Promise.all(
      blacklistedProducts.map(async (item) => {
        let productDetails = null;
        
        // Try to find product details (might be in recycle bin)
        try {
          // First try by MongoDB ID if it looks like a valid ObjectId
          if (item.productId.match(/^[0-9a-fA-F]{24}$/)) {
            productDetails = await productsCollection.findOne({
              $or: [
                { _id: new ObjectId(item.productId) },
                { id: item.productId }
              ]
            });
          } else {
            // Try by custom ID field
            productDetails = await productsCollection.findOne({ id: item.productId });
          }
        } catch (err) {
          console.error(`Error fetching details for product ${item.productId}:`, err);
        }
        
        return {
          ...item,
          productDetails: productDetails || { note: 'Product not found in database' }
        };
      })
    );
    
    return enhancedBlacklist;
  } catch (error) {
    console.error('Error getting blacklist with details:', error);
    return [];
  }
}

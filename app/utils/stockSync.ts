'use client'

/**
 * Real-time stock synchronization utility
 * This module handles real-time stock updates using WebSockets
 */

// Cache for stock data
let stockCache: Record<string, any> = {};

// Store last update timestamps
let lastUpdateTimestamps: Record<string, number> = {};

// Interval for regular polling (fallback)
const POLL_INTERVAL = 10000; // 10 seconds

// Shorter interval for active products (ones being viewed)
const ACTIVE_POLL_INTERVAL = 1000; // 1 second - more aggressive polling

/**
 * Initialize stock synchronization for a product
 * @param productId - The ID of the product to monitor
 * @param onStockChange - Callback function when stock changes
 * @returns Cleanup function
 */
export function initStockSync(productId: string, onStockChange: (stockData: any) => void) {
  // Track if this component is active (visible)
  let isActive = true;
  
  // Initial fetch
  fetchLatestStock(productId).then(onStockChange);
  
  // Set up frequent polling for active products
  const activePollInterval = setInterval(() => {
    if (isActive) {
      fetchLatestStock(productId).then(stockData => {
        // Only trigger callback if stock has changed
        if (hasStockChanged(productId, stockData)) {
          console.log(`Stock changed for product ${productId}, updating UI`);
          onStockChange(stockData);
        }
      });
    }
  }, ACTIVE_POLL_INTERVAL);
  
  // Set up less frequent polling as backup
  const regularPollInterval = setInterval(() => {
    fetchLatestStock(productId).then(stockData => {
      // Only trigger callback if stock has changed
      if (hasStockChanged(productId, stockData)) {
        console.log(`Stock changed for product ${productId} (regular poll), updating UI`);
        onStockChange(stockData);
      }
    });
  }, POLL_INTERVAL);
  
  // Handle page visibility changes
  const handleVisibilityChange = () => {
    isActive = document.visibilityState === 'visible';
    
    // Immediately fetch when becoming visible
    if (isActive) {
      fetchLatestStock(productId).then(stockData => {
        // Always update when becoming visible
        onStockChange(stockData);
      });
    }
  };
  
  // Add visibility change listener
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  
  // Return cleanup function
  return () => {
    clearInterval(activePollInterval);
    clearInterval(regularPollInterval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
}

/**
 * Fetch the latest stock data from the API
 * @param productId - The ID of the product
 * @returns Promise with stock data
 */
export async function fetchLatestStock(productId: string): Promise<any> {
  try {
    // Get the last update timestamp for this product
    const lastUpdate = lastUpdateTimestamps[productId] || 0;
    
    // Use the sync endpoint for real-time updates
    const response = await fetch(`/api/stock/sync?productId=${productId}&lastUpdate=${lastUpdate}&t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    // If status is 304 Not Modified, use cached data
    if (response.status === 304) {
      console.log(`Stock for product ${productId} is up to date`);
      return stockCache[productId] || { sizeVariants: [] };
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock: ${response.status}`);
    }
    
    const stockData = await response.json();
    
    // Ensure we have valid size variants
    if (!stockData.sizeVariants || !Array.isArray(stockData.sizeVariants) || stockData.sizeVariants.length === 0) {
      console.warn(`Received invalid size variants for product ${productId}. Using cached data if available.`);
      
      // If we have cached data with size variants, use that instead
      if (stockCache[productId] && stockCache[productId].sizeVariants && 
          Array.isArray(stockCache[productId].sizeVariants) && 
          stockCache[productId].sizeVariants.length > 0) {
        
        console.log(`Using cached size variants for product ${productId}`);
        stockData.sizeVariants = stockCache[productId].sizeVariants;
      } else {
        // Create a default size variant if we don't have any
        console.log(`Creating default size variant for product ${productId}`);
        stockData.sizeVariants = [{
          size: 'One Size',
          stock: 10,
          colorVariants: [{
            color: 'Default',
            stock: 10
          }]
        }];
      }
    }
    
    // Ensure each size variant has color variants
    stockData.sizeVariants = stockData.sizeVariants.map((sv: any) => {
      if (!sv.colorVariants || !Array.isArray(sv.colorVariants) || sv.colorVariants.length === 0) {
        return {
          ...sv,
          colorVariants: [{
            color: 'Default',
            stock: sv.stock || 10
          }]
        };
      }
      return sv;
    });
    
    // Update cache and timestamp
    stockCache[productId] = stockData;
    if (stockData.timestamp) {
      lastUpdateTimestamps[productId] = stockData.timestamp;
    }
    
    console.log(`Updated stock for product ${productId}, timestamp: ${stockData.timestamp}`);
    console.log(`Size variants count: ${stockData.sizeVariants.length}`);
    return stockData;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    // Return cached data if available, otherwise empty object
    return stockCache[productId] || { sizeVariants: [] };
  }
}

/**
 * Check if stock has changed compared to cached data
 * @param productId - The ID of the product
 * @param newData - New stock data
 * @returns Boolean indicating if stock has changed
 */
function hasStockChanged(productId: string, newData: any): boolean {
  const oldData = stockCache[productId];
  if (!oldData) return true;
  
  // Compare size variants
  if (newData.sizeVariants && oldData.sizeVariants) {
    // First check if the number of size variants has changed
    if (newData.sizeVariants.length !== oldData.sizeVariants.length) {
      console.log(`Size variant count changed for ${productId}: ${oldData.sizeVariants.length} -> ${newData.sizeVariants.length}`);
      return true;
    }
    
    for (const newSizeVariant of newData.sizeVariants) {
      const oldSizeVariant = oldData.sizeVariants.find(
        (sv: any) => sv.size === newSizeVariant.size
      );
      
      if (!oldSizeVariant) {
        console.log(`New size variant found: ${newSizeVariant.size}`);
        return true;
      }
      
      // Compare color variants
      if (newSizeVariant.colorVariants && oldSizeVariant.colorVariants) {
        // Check if the number of color variants has changed
        if (newSizeVariant.colorVariants.length !== oldSizeVariant.colorVariants.length) {
          console.log(`Color variant count changed for size ${newSizeVariant.size}`);
          return true;
        }
        
        for (const newColorVariant of newSizeVariant.colorVariants) {
          const oldColorVariant = oldSizeVariant.colorVariants.find(
            (cv: any) => cv.color === newColorVariant.color
          );
          
          if (!oldColorVariant) {
            console.log(`New color variant found: ${newColorVariant.color} for size ${newSizeVariant.size}`);
            return true;
          }
          
          if (oldColorVariant.stock !== newColorVariant.stock) {
            console.log(`Stock changed for ${newSizeVariant.size}/${newColorVariant.color}: ${oldColorVariant.stock} -> ${newColorVariant.stock}`);
            return true;
          }
        }
      }
      
      // Compare overall size stock
      if (oldSizeVariant.stock !== newSizeVariant.stock) {
        console.log(`Overall stock changed for size ${newSizeVariant.size}: ${oldSizeVariant.stock} -> ${newSizeVariant.stock}`);
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Force refresh stock for a product
 * @param productId - The ID of the product
 * @returns Promise with the latest stock data
 */
export async function forceRefreshStock(productId: string): Promise<any> {
  // Remove from cache to force a fresh fetch
  delete stockCache[productId];
  return fetchLatestStock(productId);
}

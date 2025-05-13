'use client'

/**
 * Real-time stock synchronization utility
 * This module handles real-time stock updates using WebSockets
 */

// Cache for stock data
let stockCache: Record<string, any> = {};

// Store last update timestamps
let lastUpdateTimestamps: Record<string, number> = {};

// Track products that were recently ordered
let recentlyOrderedProducts: Record<string, number> = {};

// How long to consider a product as "recently ordered" (in milliseconds)
const RECENT_ORDER_DURATION = 10000; // 10 seconds

// Interval for regular polling (fallback)
const POLL_INTERVAL = 15000; // 15 seconds - reduced from 3 seconds to prevent API flooding

// Shorter interval for active products (ones being viewed)
const ACTIVE_POLL_INTERVAL = 5000; // 5 seconds - reduced from 300ms which was too aggressive

// Maximum number of consecutive errors before implementing circuit breaker
const MAX_CONSECUTIVE_ERRORS = 3;

// Time to wait after circuit breaker trips before trying again (in milliseconds)
const CIRCUIT_BREAKER_RESET_TIME = 60000; // 1 minute

// Track consecutive errors by product ID
let consecutiveErrors: Record<string, number> = {};

// Track circuit breaker status by product ID
let circuitBreakerTripped: Record<string, number> = {};

/**
 * Initialize stock synchronization for a product
 * @param productId - The ID of the product to monitor
 * @param onStockChange - Callback function when stock changes
 * @returns Cleanup function
 */
export function initStockSync(productId: string, onStockChange: (stockData: any) => void) {
  // Track if this component is active (visible)
  let isActive = true;
  
  // Reset consecutive error count for this product
  consecutiveErrors[productId] = 0;
  
  // Initial fetch - only update UI if successful
  fetchLatestStock(productId, 0, false).then(stockData => {
    if (stockData && stockData.fetchSuccessful) {
      onStockChange(stockData);
    }
  });
  
  // Set up frequent polling for active products
  const activePollInterval = setInterval(() => {
    if (isActive) {
      // Check if circuit breaker is tripped for this product
      const circuitBreakerTime = circuitBreakerTripped[productId] || 0;
      if (circuitBreakerTime > 0) {
        // Check if it's time to reset the circuit breaker
        if (Date.now() - circuitBreakerTime >= CIRCUIT_BREAKER_RESET_TIME) {
          console.log(`Circuit breaker reset for product ${productId}`);
          circuitBreakerTripped[productId] = 0;
          consecutiveErrors[productId] = 0;
        } else {
          // Circuit breaker still active, skip this update
          return;
        }
      }
      
      // Check if this product was recently updated after an order
      const wasRecentlyOrdered = productWasRecentlyOrdered(productId);
      
      // Get the last update timestamp for this product
      const lastUpdate = lastUpdateTimestamps[productId] || 0;
      
      fetchLatestStock(productId, lastUpdate, wasRecentlyOrdered).then(stockData => {
        // Only process if the fetch was successful
        if (stockData && stockData.fetchSuccessful) {
          // Reset error count on success
          consecutiveErrors[productId] = 0;
          
          // Only trigger callback if stock has changed
          if (hasStockChanged(productId, stockData, wasRecentlyOrdered)) {
            console.log(`Stock changed for product ${productId}${wasRecentlyOrdered ? ' after order' : ''}, updating UI`);
            onStockChange(stockData);
            
            // If this was after an order, clear the flag after successful update
            if (wasRecentlyOrdered) {
              clearRecentOrderFlag(productId);
            }
          }
        }
      }).catch(error => {
        console.error(`Error in stock sync for product ${productId}:`, error);
      });
    }
  }, ACTIVE_POLL_INTERVAL);
  
  // Set up less frequent polling as backup
  const regularPollInterval = setInterval(() => {
    // Skip if circuit breaker is tripped
    if (circuitBreakerTripped[productId] > 0) {
      return;
    }

    fetchLatestStock(productId).then(stockData => {
      // Only process if the fetch was successful
      if (stockData && stockData.fetchSuccessful) {
        // Reset error count on success
        consecutiveErrors[productId] = 0;
        
        // Only trigger callback if stock has changed
        if (hasStockChanged(productId, stockData)) {
          console.log(`Stock changed for product ${productId} (regular poll), updating UI`);
          onStockChange(stockData);
        }
      }
    }).catch(error => {
      console.error(`Error in regular stock poll for product ${productId}:`, error);
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
 * @param lastUpdate - The last update timestamp for this product
 * @param afterOrder - Flag indicating if this fetch is after an order
 * @returns Promise with the latest stock data
 */
export const fetchLatestStock = async (productId: string, lastUpdate = 0, afterOrder = false): Promise<any> => {
  if (!productId) {
    console.error('fetchLatestStock called without productId');
    return { fetchSuccessful: false, sizeVariants: [] };
  }
  
  // Check if circuit breaker is tripped for this product
  if (circuitBreakerTripped[productId] > 0) {
    console.log(`Circuit breaker active for product ${productId}, using cached data`);
    return stockCache[productId] 
      ? { ...stockCache[productId], fetchSuccessful: false, circuitBreakerActive: true } 
      : { fetchSuccessful: false, sizeVariants: [], circuitBreakerActive: true };
  }
  
  try {
    // Add a unique timestamp and random value to prevent caching
    const timestamp = Date.now();
    const randomValue = Math.random().toString(36).substring(2, 10);
    
    // Use our own backend as a proxy to avoid CORS issues
    // This will call the admin panel's API server-side
    const url = `/api/stock/sync?productId=${productId}&timestamp=${timestamp}&r=${randomValue}`;
    
    // Add afterOrder parameter if this is after an order
    const finalUrl = afterOrder ? `${url}&afterOrder=true` : url;
    
    console.log(`Fetching latest stock through proxy: ${finalUrl}`);
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    // If status is 304 Not Modified, use cached data but check if it's too old
    if (response.status === 304) {
      const cachedData = stockCache[productId];
      const now = Date.now();
      
      // If we have cached data but it's older than 5 seconds, force a refresh
      if (cachedData && cachedData.timestamp && (now - cachedData.timestamp > 5000)) {
        console.log(`Cached data for product ${productId} is older than 5 seconds, forcing refresh`);
        delete stockCache[productId];
        delete lastUpdateTimestamps[productId];
        return fetchLatestStock(productId); // Recursive call with cleared cache
      }
      
      console.log(`Stock for product ${productId} is up to date`);
      return cachedData || { sizeVariants: [] };
    }
    
    if (!response.ok) {
      // Increment consecutive error count
      consecutiveErrors[productId] = (consecutiveErrors[productId] || 0) + 1;
      
      // If we've had too many consecutive errors, trip the circuit breaker
      if (consecutiveErrors[productId] >= MAX_CONSECUTIVE_ERRORS) {
        console.log(`Circuit breaker tripped for product ${productId} after ${consecutiveErrors[productId]} consecutive errors`);
        circuitBreakerTripped[productId] = Date.now();
      }
      
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
        // Don't create a default size variant - return empty array
        console.log(`No size variants available for product ${productId}`);
        stockData.sizeVariants = [];
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
    
    // Mark the fetch as successful
    return { ...stockData, fetchSuccessful: true };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    
    // Increment consecutive error count if not already handled
    if (!(circuitBreakerTripped[productId] > 0)) {
      consecutiveErrors[productId] = (consecutiveErrors[productId] || 0) + 1;
      
      // If we've had too many consecutive errors, trip the circuit breaker
      if (consecutiveErrors[productId] >= MAX_CONSECUTIVE_ERRORS) {
        console.log(`Circuit breaker tripped for product ${productId} after ${consecutiveErrors[productId]} consecutive errors`);
        circuitBreakerTripped[productId] = Date.now();
      }
    }
    
    // Return cached data if available, otherwise empty object
    // But mark the fetch as unsuccessful to prevent UI updates
    return { 
      ...(stockCache[productId] || { sizeVariants: [] }), 
      fetchSuccessful: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if stock has changed compared to cached data
 * @param productId - The ID of the product
 * @param newData - The new stock data
 * @param afterOrder - Flag indicating if this check is after an order
 * @returns boolean indicating if stock has changed
 */
export function hasStockChanged(productId: string, newData: any, afterOrder: boolean = false): boolean {
  // Always consider stock changed after an order to force refresh
  if (afterOrder) {
    console.log(`Forcing stock change detection after order for ${productId}`);
    return true;
  }
  
  // If we don't have cached data, consider it changed
  if (!stockCache[productId]) {
    return true;
  }
  
  const oldData = stockCache[productId];
  
  // Check timestamps first
  if (newData.timestamp && oldData.timestamp && newData.timestamp > oldData.timestamp) {
    console.log(`Newer timestamp detected for ${productId}: ${oldData.timestamp} -> ${newData.timestamp}`);
    return true;
  }
  
  // Check for stockUpdateTimestamp which is set by the server after stock reduction
  if (newData.stockUpdateTimestamp && (!oldData.stockUpdateTimestamp || newData.stockUpdateTimestamp > oldData.stockUpdateTimestamp)) {
    console.log(`Stock update timestamp changed for ${productId}: ${oldData.stockUpdateTimestamp || 'none'} -> ${newData.stockUpdateTimestamp}`);
    return true;
  }
  
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
          
          // This is the most important check for real-time stock updates
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
  
  // Always return true for force refreshes (after orders)
  if (newData.forceRefresh || newData.afterOrder) {
    console.log(`Force refresh flag detected for ${productId}`);
    return true;
  }
  
  return false;
}

/**
 * Mark a product as recently ordered
 * @param productId - The ID of the product
 */
export function markProductAsRecentlyOrdered(productId: string): void {
  recentlyOrderedProducts[productId] = Date.now();
  console.log(`Marked product ${productId} as recently ordered`);
}

/**
 * Check if a product was recently ordered
 * @param productId - The ID of the product
 * @returns boolean indicating if the product was recently ordered
 */
export function productWasRecentlyOrdered(productId: string): boolean {
  const orderTime = recentlyOrderedProducts[productId];
  if (!orderTime) return false;
  
  const now = Date.now();
  const isRecent = (now - orderTime) < RECENT_ORDER_DURATION;
  
  if (!isRecent) {
    // Auto-cleanup if it's no longer recent
    delete recentlyOrderedProducts[productId];
  }
  
  return isRecent;
}

/**
 * Clear the recently ordered flag for a product
 * @param productId - The ID of the product
 */
export function clearRecentOrderFlag(productId: string): void {
  delete recentlyOrderedProducts[productId];
  console.log(`Cleared recently ordered flag for product ${productId}`);
}

/**
 * Force refresh stock for a product
 * @param productId - The ID of the product
 * @param afterOrder - Flag indicating if this refresh is triggered after an order
 * @returns Promise with the latest stock data
 */
export async function forceRefreshStock(productId: string, afterOrder: boolean = false): Promise<any> {
  console.log(`Force refreshing stock for product ${productId}${afterOrder ? ' after order' : ''}`);
  
  // If this refresh is after an order, mark the product as recently ordered
  if (afterOrder) {
    markProductAsRecentlyOrdered(productId);
  }
  
  // Always clear cache for force refreshes
  delete stockCache[productId];
  // Reset the last update timestamp to force a fresh fetch
  delete lastUpdateTimestamps[productId];
  
  // First, force a server-side cache invalidation
  try {
    // Notify the server to invalidate its cache for this product
    const response = await fetch(`/api/stock/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        productId,
        forceUpdate: true,
        afterOrder: afterOrder, // Pass the afterOrder flag to the API
        timestamp: Date.now()
      })
    });
    
    if (response.ok) {
      console.log(`Server cache invalidation successful for ${productId}`);
      // Wait a moment for the server to process the invalidation
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.warn(`Server cache invalidation failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error requesting cache invalidation:', error);
  }
  
  // Now fetch with aggressive cache-busting
  try {
    // Add multiple cache-busting techniques
    // For after-order requests, add an extra time buffer to ensure we get fresh data
    const timestamp = afterOrder ? Date.now() + 10000 : Date.now();
    const randomParam = Math.random().toString(36).substring(2, 10);
    
    // Include afterOrder flag in the URL if applicable
    const afterOrderParam = afterOrder ? '&afterOrder=true' : '';
    
    // For after-order requests, add a special parameter to bypass any caching
    const bypassCacheParam = afterOrder ? '&bypassCache=true' : '';
    
    const response = await fetch(`/api/stock/sync?productId=${productId}&t=${timestamp}&r=${randomParam}${afterOrderParam}${bypassCacheParam}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fresh stock data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched fresh stock data for ${productId}`);
    
    // Update cache with fresh data
    stockCache[productId] = data;
    if (data.timestamp) {
      lastUpdateTimestamps[productId] = data.timestamp;
    }
    
    return data;
  } catch (fetchError) {
    console.error('Error fetching fresh stock data:', fetchError);
    // Fall back to regular fetch as a last resort
    return fetchLatestStock(productId);
  }
}

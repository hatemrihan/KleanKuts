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
const POLL_INTERVAL = 3000; // 3 seconds - faster polling for better responsiveness

// Shorter interval for active products (ones being viewed)
const ACTIVE_POLL_INTERVAL = 300; // 300 milliseconds - very aggressive polling for real-time updates

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
    
    // Add cache-busting parameters to ensure we get fresh data
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    
    // Use the sync endpoint for real-time updates with enhanced cache busting
    const response = await fetch(
      `/api/stock/sync?productId=${productId}&lastUpdate=${lastUpdate}&t=${timestamp}&r=${random}`, 
      {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
    
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
  
  // Check if the timestamp is newer - this is critical for real-time updates
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
 * Force refresh stock for a product
 * @param productId - The ID of the product
 * @param afterOrder - Flag indicating if this refresh is triggered after an order
 * @returns Promise with the latest stock data
 */
export async function forceRefreshStock(productId: string, afterOrder: boolean = false): Promise<any> {
  console.log(`Force refreshing stock for product ${productId}${afterOrder ? ' after order' : ''}`);
  
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
    const timestamp = Date.now();
    const randomParam = Math.random().toString(36).substring(2, 10);
    
    // Include afterOrder flag in the URL if applicable
    const afterOrderParam = afterOrder ? '&afterOrder=true' : '';
    
    const response = await fetch(`/api/stock/sync?productId=${productId}&t=${timestamp}&r=${randomParam}${afterOrderParam}`, {
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

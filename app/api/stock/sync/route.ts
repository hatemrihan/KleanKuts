import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

// Maximum number of retries for admin panel sync
const MAX_RETRIES = 3;
// Delay between retries (in milliseconds)
const RETRY_DELAY = 500;

// Cache for last update timestamps
const productUpdateTimestamps: Record<string, number> = {};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const lastUpdate = url.searchParams.get('lastUpdate');
    const afterOrder = url.searchParams.get('afterOrder') === 'true';
    const timestamp = url.searchParams.get('timestamp');
    const randomValue = url.searchParams.get('r');
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Convert lastUpdate to number or use 0 as default
    const lastUpdateTime = lastUpdate ? parseInt(lastUpdate, 10) : 0;
    
    // Check if there's a newer update available
    const lastKnownUpdate = productUpdateTimestamps[productId] || 0;
    
    // For after-order requests, always send fresh data to ensure real-time updates
    // Otherwise, if client has the latest data already, return a 304 Not Modified
    if (!afterOrder && lastUpdateTime >= lastKnownUpdate && lastUpdateTime > 0) {
      return new Response(null, { status: 304 });
    }
    
    // If this is an after-order request, log it for debugging
    if (afterOrder) {
      console.log(`🔥 Processing after-order stock request for product ${productId}`);
    }
    
    // PROXY REQUEST TO ADMIN PANEL
    // This solves the CORS issues by making the request server-side
    try {
      console.log(`Proxying stock request to admin panel for product ${productId}`);
      
      // Construct the admin panel URL with the correct endpoint structure
      // Based on the admin panel's API format
      let adminUrl = `https://eleveadmin.netlify.app/api/stock/${productId}`;
      
      // Add query parameters if they exist
      const queryParams = [];
      if (timestamp) queryParams.push(`timestamp=${timestamp}`);
      if (randomValue) queryParams.push(`r=${randomValue}`);
      if (afterOrder) queryParams.push('afterOrder=true');
      
      // Add bypass cache parameter to ensure fresh data
      queryParams.push(`bypassCache=${Date.now()}`);
      
      // Add a special flag to indicate this is a stock sync request from the e-commerce site
      queryParams.push('source=ecommerce');
      
      if (queryParams.length > 0) {
        adminUrl += `?${queryParams.join('&')}`;
      }
      
      console.log(`Connecting to admin panel at: ${adminUrl}`);
      
      // Make the request to the admin panel with retry logic
      let adminResponse = null;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Admin panel request attempt ${retryCount + 1}/${maxRetries + 1}`);
          
          // Try multiple potential endpoint formats
          // This handles cases where the admin panel API might have been updated
          const possibleEndpoints = [
            adminUrl,
            `https://eleveadmin.netlify.app/api/products/${productId}/stock`,
            `https://eleveadmin.netlify.app/api/stock/query?productId=${productId}`,
            `https://eleveadmin.netlify.app/api/inventory/${productId}`
          ];
          
          // Try each endpoint until we find one that works
          let endpointSuccess = false;
          
          for (const endpoint of possibleEndpoints) {
            try {
              console.log(`Trying endpoint: ${endpoint}`);
              
              adminResponse = await fetch(endpoint, {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                  'Origin': 'https://elevee.netlify.app',
                  'X-Request-Time': Date.now().toString(),
                  'X-Source': 'ecommerce',
                  'X-API-Version': '1.0'
                },
                // Add a reasonable timeout, but not too short
                signal: AbortSignal.timeout(8000)
              });
              
              if (adminResponse.ok) {
                console.log(`Successfully connected using endpoint: ${endpoint}`);
                endpointSuccess = true;
                break;
              }
            } catch (endpointError) {
              console.log(`Endpoint ${endpoint} failed:`, endpointError);
              // Continue trying other endpoints
            }
          }
          
          if (!endpointSuccess || !adminResponse) {
            throw new Error('All endpoints failed');
          }
          
          // If successful, break out of the retry loop
          if (adminResponse && adminResponse.ok) {
            console.log(`Admin panel request succeeded on attempt ${retryCount + 1}`);
            break;
          } else {
            console.log(`Admin panel request failed on attempt ${retryCount + 1} with status ${adminResponse.status}`);
            retryCount++;
            
            if (retryCount <= maxRetries) {
              // Wait before retrying (exponential backoff)
              const waitTime = RETRY_DELAY * Math.pow(2, retryCount);
              console.log(`Waiting ${waitTime}ms before retry ${retryCount + 1}`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        } catch (fetchError) {
          console.error(`Fetch error on attempt ${retryCount + 1}:`, fetchError);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Wait before retrying
            const waitTime = RETRY_DELAY * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            // All retries failed, continue to fallback
            console.log('All admin panel request attempts failed, using fallback');
            break;
          }
        }
      }
      
      // If the admin panel request was successful, return the response directly
      if (adminResponse && adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log(`Successfully fetched stock data from admin panel for product ${productId}`);
        
        // Update the last known update timestamp
        productUpdateTimestamps[productId] = Date.now();
        
        // Don't add any default sizes - only return what the admin panel provides
        // This ensures we don't show "One Size" when there are no sizes available
        
        // Add timestamp to the response
        adminData.timestamp = Date.now();
        
        // Return the admin panel response
        return NextResponse.json(adminData, {
          headers: {
            'X-Stock-Timestamp': Date.now().toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
      } else if (adminResponse) {
        console.error(`Admin panel returned error ${adminResponse.status} for product ${productId}`);
      } else {
        console.error(`No admin response received for product ${productId}`);
      }
    } catch (adminError) {
      console.error(`Error proxying request to admin panel: ${adminError}`);
      // Continue to fallback approach below
    }
    
    // FALLBACK: If admin panel request failed, use our local database
    console.log(`Using fallback approach for product ${productId} - admin panel connection failed or returned error`);
    
    // Connect to the database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Try to find the product by MongoDB ObjectId first
    let product;
    try {
      product = await productsCollection.findOne({ _id: new ObjectId(productId) });
    } catch (error) {
      // If the ID is not a valid ObjectId, try to find by custom ID field
      product = await productsCollection.findOne({ id: productId });
    }
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Extract only the stock-related information to keep the response small
    // Ensure the product has proper size variants structure
    let sizeVariants = [];
    
    if (product.sizeVariants && Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) {
      // Use existing size variants but ensure they have color variants
      sizeVariants = product.sizeVariants.map((sv: any) => {
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
    } else if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      // Create size variants from sizes
      sizeVariants = product.sizes.map((size: any) => {
        // If size is a string, convert to object
        const sizeObj = typeof size === 'string' 
          ? { size, stock: 10, isPreOrder: false }
          : size;
          
        return {
          size: sizeObj.size,
          stock: sizeObj.stock || 10,
          colorVariants: [{
            color: 'Default',
            stock: sizeObj.stock || 10
          }]
        };
      });
    } else {
      // Create a default size variant
      sizeVariants = [{
        size: 'One Size',
        stock: 10,
        colorVariants: [{
          color: 'Default',
          stock: 10
        }]
      }];
    }
    
    const stockInfo = {
      _id: product._id,
      sizeVariants: sizeVariants,
      sizes: product.sizes || [],
      success: true,
      timestamp: Date.now()
    };
    
    console.log(`Returning stock info with ${sizeVariants.length} size variants`);
    
    // Update the timestamp cache
    productUpdateTimestamps[productId] = stockInfo.timestamp;
    
    // Set cache control headers to prevent caching
    const currentTimestamp = Date.now();
    return new Response(JSON.stringify({
      ...stockInfo,
      afterOrder: afterOrder || false,
      forceRefresh: afterOrder || false
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'X-Stock-Timestamp': currentTimestamp.toString()
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching product stock:', error);
    return NextResponse.json(
      { success: false, message: `Error fetching product stock: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stock/sync
 * Updates stock information and synchronizes with admin panel
 * Includes retry logic, admin panel integration, and fallback mechanisms
 */
export async function POST(request: Request) {
  try {
    const { productId, timestamp, forceUpdate, orderId } = await request.json();
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Update the timestamp for this product with a buffer to ensure it's newer than any cached data
    const currentTime = timestamp || Date.now();
    // Add a random buffer (50-200ms) to ensure unique timestamps and force cache invalidation
    const timeBuffer = Math.floor(Math.random() * 150) + 50;
    productUpdateTimestamps[productId] = currentTime + timeBuffer;
    
    console.log(`🔄 Stock sync timestamp updated for product ${productId}: ${currentTime} (with buffer: ${currentTime + timeBuffer})`);
    
    // If forceUpdate is true, invalidate any cached data and try to sync with admin panel
    if (forceUpdate) {
      console.log(`⚡ Force update requested for product ${productId} - invalidating cache`);
      // This will force all clients to refresh their data immediately
      // Use an even larger buffer for force updates to ensure priority
      productUpdateTimestamps[productId] = currentTime + 2000; // Add larger buffer for force updates
      
      // Try to sync with admin panel if available
      let adminSyncSuccess = false;
      const adminSyncUrl = process.env.ADMIN_SYNC_URL;
      
      if (adminSyncUrl) {
        let retryCount = 0;
        
        while (retryCount < MAX_RETRIES && !adminSyncSuccess) {
          try {
            console.log(`Attempting to sync with admin panel (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            
            const adminResponse = await fetch(adminSyncUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ADMIN_API_KEY || ''}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              body: JSON.stringify({
                productId,
                timestamp: currentTime,
                orderId: orderId || 'unknown',
                source: 'website'
              })
            });
            
            if (adminResponse.ok) {
              adminSyncSuccess = true;
              console.log(`✅ Successfully synced product ${productId} with admin panel`);
              
              // Try to get updated stock data from admin panel
              try {
                const { db } = await connectToDatabase();
                const productsCollection = db.collection('products');
                
                // Try to find the product by MongoDB ObjectId first
                let productObjectId;
                try {
                  productObjectId = new ObjectId(productId);
                } catch (error) {
                  // If not a valid ObjectId, use as is
                  console.warn(`Invalid ObjectId format for ${productId}, using as string ID`);
                }
                
                // Get fresh data from admin panel if possible
                const adminDataResponse = await fetch(`${adminSyncUrl}/product/${productId}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${process.env.ADMIN_API_KEY || ''}`,
                    'Cache-Control': 'no-cache'
                  }
                });
                
                if (adminDataResponse.ok) {
                  const adminData = await adminDataResponse.json();
                  
                  if (adminData && adminData.sizeVariants) {
                    // Update the product in the database with fresh data
                    const updateQuery = productObjectId ? { _id: productObjectId } : { id: productId };
                    
                    await productsCollection.updateOne(updateQuery, {
                      $set: {
                        sizeVariants: adminData.sizeVariants,
                        lastSyncedAt: new Date().toISOString()
                      }
                    });
                    
                    console.log(`✅ Updated product ${productId} with fresh data from admin panel`);
                  }
                }
              } catch (dbError) {
                console.error('Error updating product with admin data:', dbError);
                // Don't fail the operation, this is just an optimization
              }
            } else {
              console.warn(`⚠️ Admin panel sync failed: ${adminResponse.status}`);
              retryCount++;
              
              if (retryCount < MAX_RETRIES) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              }
            }
          } catch (syncError) {
            console.error('Error syncing with admin panel:', syncError);
            retryCount++;
            
            if (retryCount < MAX_RETRIES) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
          }
        }
        
        if (!adminSyncSuccess) {
          console.error(`Failed to sync with admin panel after ${MAX_RETRIES} attempts`);
          // Continue anyway - we'll use our local data as fallback
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Stock update notification sent',
      timestamp: productUpdateTimestamps[productId],
      forceUpdate: !!forceUpdate
    });
    
  } catch (error: any) {
    console.error('Error updating stock timestamp:', error);
    return NextResponse.json(
      { success: false, message: `Error updating stock timestamp: ${error.message}` },
      { status: 500 }
    );
  }
}

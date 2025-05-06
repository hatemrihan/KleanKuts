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
    
    // If client has the latest data already, return a 304 Not Modified
    if (lastUpdateTime >= lastKnownUpdate && lastUpdateTime > 0) {
      return new Response(null, { status: 304 });
    }
    
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
    return new Response(JSON.stringify(stockInfo), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
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
    
    // Update the timestamp for this product
    const currentTime = timestamp || Date.now();
    productUpdateTimestamps[productId] = currentTime;
    
    console.log(`🔄 Stock sync timestamp updated for product ${productId}: ${currentTime}`);
    
    // If forceUpdate is true, invalidate any cached data and try to sync with admin panel
    if (forceUpdate) {
      console.log(`⚡ Force update requested for product ${productId} - invalidating cache`);
      // This will force all clients to refresh their data immediately
      productUpdateTimestamps[productId] = currentTime + 1000; // Add buffer to ensure it's newer
      
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

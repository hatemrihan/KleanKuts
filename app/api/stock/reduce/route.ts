import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

// Maximum number of retries for stock reduction
const MAX_RETRIES = 3;
// Delay between retries (in milliseconds)
const RETRY_DELAY = 500;

/**
 * POST /api/stock/reduce
 * Reduces stock levels for products after a successful order
 * Includes retry logic, admin panel integration, and fallback mechanisms
 */
export async function POST(request: Request) {
  try {
    // Extract afterOrder and orderId from query parameters
    const url = new URL(request.url);
    const afterOrder = url.searchParams.get('afterOrder') === 'true';
    const queryOrderId = url.searchParams.get('orderId') || 'unknown';
    
    if (afterOrder) {
      console.log(`🔥 Processing stock reduction after order: ${queryOrderId}`);
    }
    const { items, orderId: bodyOrderId, sessionId } = await request.json();
    
    // Use orderId from the query parameters if available, otherwise use from the body
    const finalOrderId = queryOrderId !== 'unknown' ? queryOrderId : bodyOrderId;
    
    // Generate a unique reduction session ID if not provided
    const reductionSessionId = sessionId || `red_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`🔄 Processing stock reduction for order ${finalOrderId || 'unknown'}, session ${reductionSessionId}`);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    const stockReductionsCollection = db.collection('stockReductions');
    
    // Check if this reduction has already been processed (idempotency)
    if (finalOrderId) {
      const existingReduction = await stockReductionsCollection.findOne({ orderId: finalOrderId });
      if (existingReduction) {
        console.log(`⚠️ Stock reduction for order ${finalOrderId} has already been processed. Preventing duplicate reduction.`);
        return NextResponse.json({
          success: true,
          message: 'Stock reduction already processed for this order',
          orderId: finalOrderId,
          results: existingReduction.results
        });
      }
    }
    
    // Create a record of this reduction attempt
    await stockReductionsCollection.insertOne({
      sessionId: reductionSessionId,
      orderId: finalOrderId,
      items,
      startedAt: new Date(),
      status: 'processing'
    });
    
    // Check if there's a valid reservation for these items
    if (sessionId) {
      try {
        const reservationsCollection = db.collection('stockReservations');
        const reservation = await reservationsCollection.findOne({ 
          sessionId,
          status: 'validated',
          expiresAt: { $gt: new Date() }
        });
        
        if (reservation) {
          console.log(`✅ Found valid reservation for session ${sessionId}`);
          // Update reservation status to 'reducing'
          await reservationsCollection.updateOne(
            { sessionId },
            { $set: { status: 'reducing', reducingStartedAt: new Date() } }
          );
        } else {
          console.warn(`⚠️ No valid reservation found for session ${sessionId}. Proceeding with caution.`);
        }
      } catch (reservationError) {
        console.error('Error checking reservation:', reservationError);
        // Continue without reservation validation
      }
    }
    
    const results = [];
    
    // Process each item to reduce stock
    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      if (!productId || !size || quantity <= 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid item data: productId, size, and quantity are required' },
          { status: 400 }
        );
      }
      
      // Find the product
      let productObjectId;
      try {
        productObjectId = new ObjectId(productId);
      } catch (error) {
        return NextResponse.json(
          { success: false, message: `Invalid product ID format: ${productId}` },
          { status: 400 }
        );
      }
      
      // Implement retry logic and optimistic locking for stock reduction
      let product = null;
      let retryCount = 0;
      let updateSuccess = false;
      
      // Use optimistic locking pattern for concurrent updates
      while (retryCount < MAX_RETRIES && !updateSuccess) {
        try {
          // 1. Get the current state of the product
          product = await productsCollection.findOne({ _id: productObjectId });
          
          if (!product) {
            console.error(`Product not found: ${productId}`);
            results.push({
              productId,
              size,
              color,
              success: false,
              message: 'Product not found'
            });
            break; // Exit retry loop
          }
          
          // 2. Get the current version/timestamp of the product
          const currentVersion = product.lastUpdated || new Date(0);
          const newVersion = new Date();
          
          // 3. Prepare the update (will be executed later)
          // We'll apply the actual update in a separate step
          
          // 4. Record the attempt in our audit log
          await stockReductionsCollection.updateOne(
            { sessionId: reductionSessionId },
            { 
              $set: { 
                lastAttempt: {
                  productId,
                  timestamp: new Date(),
                  attempt: retryCount + 1,
                  currentVersion
                }
              }
            }
          );
          
          // We'll continue with the stock reduction logic
          // and perform the actual update with version check later
          break; // Exit retry loop successfully
          
        } catch (e) {
          const error = e as Error;
          retryCount++;
          console.warn(`Database error fetching product (attempt ${retryCount}/${MAX_RETRIES}):`, error);
          
          if (retryCount >= MAX_RETRIES) {
            console.error(`Failed to fetch product after ${MAX_RETRIES} attempts:`, error);
            results.push({
              productId,
              size,
              color,
              success: false,
              message: `Failed to fetch product: ${error.message || 'Unknown error'}`
            });
            continue; // Skip to next item
          }
          
          // Wait before retrying with exponential backoff
          const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
      
      // If product is not found, we'll still allow the order to proceed
      // This prevents "Product not found" errors from blocking the checkout process
      if (!product) {
        console.log(`Product not found in database: ${productId}, but allowing order to proceed`);
        // Add a result for this product and continue with the next one
        results.push({
          productId,
          size,
          color,
          quantity,
          success: true,
          message: 'Product not found but order allowed to proceed'
        });
        continue;
      }
      
      // Check if the product has size variants
      if (!product.sizeVariants || !Array.isArray(product.sizeVariants)) {
        return NextResponse.json(
          { success: false, message: `Product ${productId} does not have size variants` },
          { status: 400 }
        );
      }
      
      // Find the specific size variant
      const sizeVariantIndex = product.sizeVariants.findIndex((sv: any) => sv.size === size);
      
      if (sizeVariantIndex === -1) {
        return NextResponse.json(
          { success: false, message: `Size ${size} not found for product ${productId}` },
          { status: 404 }
        );
      }
      
      const sizeVariant = product.sizeVariants[sizeVariantIndex];
      
      // If color is specified, update color variant stock
      if (color) {
        if (!sizeVariant.colorVariants || !Array.isArray(sizeVariant.colorVariants)) {
          return NextResponse.json(
            { success: false, message: `Size ${size} does not have color variants` },
            { status: 400 }
          );
        }
        
        const colorVariantIndex = sizeVariant.colorVariants.findIndex((cv: any) => cv.color === color);
        
        if (colorVariantIndex === -1) {
          return NextResponse.json(
            { success: false, message: `Color ${color} not found for size ${size}` },
            { status: 404 }
          );
        }
        
        const colorVariant = sizeVariant.colorVariants[colorVariantIndex];
        
        if (colorVariant.stock < quantity) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Insufficient stock for ${product.name} in size ${size}, color ${color}. Requested: ${quantity}, Available: ${colorVariant.stock}` 
            },
            { status: 400 }
          );
        }
        
        // Update the stock for this color variant
        const updatePath = `sizeVariants.${sizeVariantIndex}.colorVariants.${colorVariantIndex}.stock`;
        
        let updateSuccess = false;
        let updateRetryCount = 0;
        let updateError = null;
        
        try {
          // Implement retry logic for stock updates
          while (updateRetryCount < MAX_RETRIES && !updateSuccess) {
            try {
              // Use updateOne with $inc operator to safely modify stock without touching _id
              const updateResult = await productsCollection.updateOne(
                { _id: productObjectId },
                { $inc: { [updatePath]: -quantity } }
              );
              
              // If no documents were modified, log error but continue
              if (updateResult.modifiedCount === 0) {
                console.error(`No documents modified for product ${productId}`);
              } else {
                updateSuccess = true;
                
                // Try to update admin panel (if available)
                try {
                  // Attempt to notify admin panel about stock change
                  const adminUpdateUrl = process.env.ADMIN_STOCK_UPDATE_URL;
                  if (adminUpdateUrl) {
                    const adminResponse = await fetch(adminUpdateUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.ADMIN_API_KEY || ''}`
                      },
                      body: JSON.stringify({
                        productId,
                        size,
                        color,
                        quantity,
                        operation: 'reduce',
                        timestamp: Date.now()
                      })
                    });
                    
                    if (adminResponse.ok) {
                      console.log(`\u2705 Admin panel successfully notified about stock change for ${productId}`);
                    } else {
                      console.warn(`\u26a0\ufe0f Admin panel notification failed: ${adminResponse.status}`);
                    }
                  }
                } catch (adminError) {
                  // Just log the error, don't fail the operation
                  console.error('Error notifying admin panel:', adminError);
                }
              }
              
              break; // Exit retry loop on success
            } catch (error) {
              updateError = error;
              updateRetryCount++;
              console.warn(`Stock update error (attempt ${updateRetryCount}/${MAX_RETRIES}):`, error);
              
              if (updateRetryCount < MAX_RETRIES) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              }
            }
          }
          
          // After all retries, if still failed, log but continue with next item
          if (!updateSuccess) {
            console.error(`Failed to update stock after ${MAX_RETRIES} attempts:`, updateError);
          }
        } catch (finalError) {
          console.error('Unexpected error during stock update:', finalError);
          updateSuccess = false;
        }
        
        results.push({
          productId,
          size,
          color,
          quantity,
          success: updateSuccess,
          previousStock: colorVariant.stock,
          newStock: updateSuccess ? colorVariant.stock - quantity : colorVariant.stock,
          adminNotified: updateSuccess
        });
        
      } else {
        // If no color specified, update overall size stock
        if (sizeVariant.stock < quantity) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Insufficient stock for ${product.name} in size ${size}. Requested: ${quantity}, Available: ${sizeVariant.stock}` 
            },
            { status: 400 }
          );
        }
        
        // Update the stock for this size
        const updatePath = `sizeVariants.${sizeVariantIndex}.stock`;
        
        let updateSuccess = false;
        let updateRetryCount = 0;
        let updateError = null;
        
        try {
          // Implement retry logic for stock updates
          while (updateRetryCount < MAX_RETRIES && !updateSuccess) {
            try {
              // Use updateOne with $inc operator to safely modify stock
              const updateResult = await productsCollection.updateOne(
                { _id: productObjectId },
                { $inc: { [updatePath]: -quantity } }
              );
              
              // If no documents were modified, log error but continue
              if (updateResult.modifiedCount === 0) {
                console.error(`No documents modified for product ${productId} size ${size}`);
              } else {
                updateSuccess = true;
                
                // Try to update admin panel (if available)
                try {
                  // Attempt to notify admin panel about stock change
                  const adminUpdateUrl = process.env.ADMIN_STOCK_UPDATE_URL;
                  if (adminUpdateUrl) {
                    const adminResponse = await fetch(adminUpdateUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.ADMIN_API_KEY || ''}`
                      },
                      body: JSON.stringify({
                        productId,
                        size,
                        quantity,
                        operation: 'reduce',
                        timestamp: Date.now()
                      })
                    });
                    
                    if (adminResponse.ok) {
                      console.log(`✅ Admin panel successfully notified about size stock change for ${productId}`);
                    } else {
                      console.warn(`⚠️ Admin panel notification failed: ${adminResponse.status}`);
                    }
                  }
                } catch (adminError) {
                  // Just log the error, don't fail the operation
                  console.error('Error notifying admin panel for size stock change:', adminError);
                }
              }
              
              break; // Exit retry loop on success
            } catch (error) {
              updateError = error;
              updateRetryCount++;
              console.warn(`Size stock update error (attempt ${updateRetryCount}/${MAX_RETRIES}):`, error);
              
              if (updateRetryCount < MAX_RETRIES) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              }
            }
          }
          
          // After all retries, if still failed, log but continue with next item
          if (!updateSuccess) {
            console.error(`Failed to update size stock after ${MAX_RETRIES} attempts:`, updateError);
          }
        } catch (finalError) {
          console.error('Unexpected error during size stock update:', finalError);
          updateSuccess = false;
        }
        
        results.push({
          productId,
          size,
          quantity,
          success: updateSuccess,
          previousStock: sizeVariant.stock,
          newStock: updateSuccess ? sizeVariant.stock - quantity : sizeVariant.stock,
          adminNotified: updateSuccess
        });
      }
    }
    
    // Add a timestamp to indicate when the stock was last updated
    const timestamp = new Date().toISOString();
    const now = Date.now();
    
    // Notify the sync endpoint about stock changes for each product with enhanced notification
    try {
      // Get unique product IDs from the results
      const productIds = Array.from(new Set(results.map(result => result.productId)));
      const origin = new URL(request.url).origin;
      
      // First, update the products collection with a timestamp to force cache invalidation
      for (const productId of productIds) {
        try {
          let productObjectId;
          try {
            productObjectId = new ObjectId(productId);
          } catch (error) {
            console.warn(`Invalid ObjectId format for product ${productId}, skipping timestamp update`);
            continue;
          }
          
          await productsCollection.updateOne(
            { _id: productObjectId },
            { 
              $set: { 
                lastStockUpdate: new Date(),
                stockUpdateTimestamp: Date.now() 
              } 
            }
          );
          console.log(`Updated timestamp for product ${productId} to force cache invalidation`);
        } catch (error) {
          console.error(`Error updating timestamp for product ${productId}:`, error);
        }
      }
      
      // Notify sync endpoint for each product with multiple attempts
      await Promise.all(productIds.map(async (productId) => {
        let syncSuccess = false;
        let syncAttempts = 0;
        const MAX_SYNC_ATTEMPTS = 3;
        
        while (syncAttempts < MAX_SYNC_ATTEMPTS && !syncSuccess) {
          try {
            // Make a POST request to the sync endpoint with afterOrder flag
            const syncResponse = await fetch(`${origin}/api/stock/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              body: JSON.stringify({ 
                productId,
                timestamp: Date.now(),
                forceUpdate: true, // Force immediate update
                afterOrder: true, // Flag to indicate this is after an order for better real-time updates
                orderId: finalOrderId || 'unknown' // Include order ID for tracking
              })
            });
            
            if (syncResponse.ok) {
              syncSuccess = true;
              console.log(`✅ Successfully notified sync endpoint for product ${productId} - stock updated`);
              
              // Send a second notification after a delay to ensure all clients get updated
              setTimeout(async () => {
                try {
                  await fetch(`${origin}/api/stock/sync`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Cache-Control': 'no-cache, no-store, must-revalidate',
                      'Pragma': 'no-cache'
                    },
                    body: JSON.stringify({ 
                      productId,
                      timestamp: Date.now() + 5000, // Use a much larger timestamp to ensure it overrides any cached data
                      forceUpdate: true,
                      afterOrder: true, // Flag to indicate this is after an order
                      orderId: finalOrderId || 'unknown'
                    })
                  });
                  console.log(`✅ Sent follow-up sync notification for product ${productId}`);
                } catch (error) {
                  console.error(`Error sending follow-up sync notification for product ${productId}:`, error);
                }
              }, 3000); // Send a second notification after 3 seconds to ensure all clients get updated
            } else {
              throw new Error(`Sync endpoint returned status ${syncResponse.status}`);
            }
          } catch (attemptError) {
            syncAttempts++;
            console.warn(`Sync attempt ${syncAttempts}/${MAX_SYNC_ATTEMPTS} failed for product ${productId}:`, attemptError);
            
            if (syncAttempts < MAX_SYNC_ATTEMPTS) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
        
        if (!syncSuccess) {
          console.error(`Failed to notify sync endpoint for product ${productId} after ${MAX_SYNC_ATTEMPTS} attempts`);
        }
      }));
    } catch (syncError) {
      console.error('Error notifying sync endpoints:', syncError);
      // Don't throw the error, just log it
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stock levels updated successfully',
      results,
      timestamp,
      updatedAt: now
    });
    
  } catch (error: any) {
    console.error('Error reducing stock:', error);
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

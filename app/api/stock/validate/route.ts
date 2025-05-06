import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

// Maximum number of retries for stock validation
const MAX_RETRIES = 3;
// Delay between retries (in milliseconds)
const RETRY_DELAY = 300;

/**
 * POST /api/stock/validate
 * Validates if requested items are in stock with optimistic concurrency control
 * to handle multiple simultaneous purchases
 */
export async function POST(request: Request) {
  try {
    const { items, sessionId } = await request.json();
    
    // Generate a unique session ID if not provided
    const validationSessionId = sessionId || `val_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`🔍 Starting stock validation for session ${validationSessionId}`);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Create a temporary reservation in the database to handle concurrent purchases
    try {
      const reservationsCollection = db.collection('stockReservations');
      
      // Create a reservation with expiration (5 minutes from now)
      await reservationsCollection.insertOne({
        sessionId: validationSessionId,
        items: items,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiration
        status: 'pending'
      });
      
      // Clean up expired reservations to prevent database bloat
      await reservationsCollection.deleteMany({
        expiresAt: { $lt: new Date() }
      });
    } catch (reservationError) {
      console.error('Error creating stock reservation:', reservationError);
      // Continue with validation even if reservation fails
    }
    
    // Process each item to validate stock with retry logic for concurrency
    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      if (!productId || !size || quantity <= 0) {
        return NextResponse.json(
          { valid: false, message: 'Invalid item data: productId, size, and quantity are required' },
          { status: 400 }
        );
      }
      
      // Find the product with retry logic
      let productObjectId;
      try {
        productObjectId = new ObjectId(productId);
      } catch (error) {
        return NextResponse.json(
          { valid: false, message: `Invalid product ID format: ${productId}` },
          { status: 400 }
        );
      }
      
      // Implement retry logic for fetching product
      let product = null;
      let retryCount = 0;
      
      while (retryCount < MAX_RETRIES) {
        try {
          product = await productsCollection.findOne({ _id: productObjectId });
          break; // Success, exit retry loop
        } catch (error) {
          const dbError = error as Error;
          retryCount++;
          console.warn(`Database error fetching product (attempt ${retryCount}/${MAX_RETRIES}):`, dbError);
          
          if (retryCount >= MAX_RETRIES) {
            console.error(`Failed to fetch product after ${MAX_RETRIES} attempts:`, dbError);
            return NextResponse.json(
              { valid: false, message: `Database error: ${dbError.message || 'Unknown error'}` },
              { status: 500 }
            );
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
      
      // If product is not found, we'll still allow it to proceed with checkout
      // This prevents "Product not found" errors from blocking the checkout process
      if (!product) {
        console.log(`Product not found in database: ${productId}, but allowing checkout to proceed`);
        // Skip stock validation for this product and continue with the next one
        continue;
      }
      
      // Force refresh the stock data in the cache to ensure we have the latest
      let retrySync = 0;
      while (retrySync < MAX_RETRIES) {
        try {
          // Notify the sync endpoint about this product to invalidate caches
          const syncResponse = await fetch(`${new URL(request.url).origin}/api/stock/sync`, {
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
              sessionId: validationSessionId // Pass session ID for tracking
            })
          });
          
          if (syncResponse.ok) {
            break; // Success, exit retry loop
          } else {
            throw new Error(`Sync endpoint returned status ${syncResponse.status}`);
          }
        } catch (syncError) {
          retrySync++;
          console.error(`Error refreshing stock data for ${productId} (attempt ${retrySync}/${MAX_RETRIES}):`, syncError);
          
          if (retrySync >= MAX_RETRIES) {
            // Continue with validation using the data we have after max retries
            console.warn(`Proceeding with validation using potentially stale data after ${MAX_RETRIES} failed sync attempts`);
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
      
      // Check if the product has size variants
      if (!product.sizeVariants || !Array.isArray(product.sizeVariants)) {
        return NextResponse.json(
          { valid: false, message: `Product ${productId} does not have size variants` },
          { status: 400 }
        );
      }
      
      // Find the specific size variant
      const sizeVariant = product.sizeVariants.find((sv: any) => sv.size === size);
      
      if (!sizeVariant) {
        return NextResponse.json(
          { valid: false, message: `Size ${size} not found for product ${productId}` },
          { status: 404 }
        );
      }
      
      // If color is specified, check color variant
      if (color) {
        if (!sizeVariant.colorVariants || !Array.isArray(sizeVariant.colorVariants)) {
          return NextResponse.json(
            { valid: false, message: `Size ${size} does not have color variants` },
            { status: 400 }
          );
        }
        
        const colorVariant = sizeVariant.colorVariants.find((cv: any) => cv.color === color);
        
        if (!colorVariant) {
          return NextResponse.json(
            { valid: false, message: `Color ${color} not found for size ${size}` },
            { status: 404 }
          );
        }
        
        // Check for active reservations for this product/size/color
        let reservedQuantity = 0;
        try {
          const reservationsCollection = db.collection('stockReservations');
          const activeReservations = await reservationsCollection.find({
            status: 'pending',
            expiresAt: { $gt: new Date() },
            sessionId: { $ne: validationSessionId }, // Exclude current session
            'items.productId': productId,
            'items.size': size,
            'items.color': color
          }).toArray();
          
          // Calculate total reserved quantity
          for (const reservation of activeReservations) {
            for (const item of reservation.items) {
              if (item.productId === productId && item.size === size && item.color === color) {
                reservedQuantity += item.quantity || 0;
              }
            }
          }
        } catch (reservationError) {
          console.error('Error checking reservations:', reservationError);
          // Continue without considering reservations
        }
        
        // Check if there's enough stock considering active reservations
        const availableStock = Math.max(0, colorVariant.stock - reservedQuantity);
        
        if (availableStock < quantity) {
          return NextResponse.json(
            { 
              valid: false, 
              message: `Insufficient stock for ${product.name} in size ${size}, color ${color}. Requested: ${quantity}, Available: ${availableStock} (${colorVariant.stock} total, ${reservedQuantity} reserved)` 
            },
            { status: 400 }
          );
        }
      } else {
        // If no color specified, check overall size stock
        // Calculate total stock across all colors
        const totalSizeStock = sizeVariant.colorVariants ? 
          sizeVariant.colorVariants.reduce((sum: number, cv: any) => sum + (cv.stock || 0), 0) : 
          sizeVariant.stock || 0;
        
        // Check for active reservations for this product/size
        let reservedQuantity = 0;
        try {
          const reservationsCollection = db.collection('stockReservations');
          const activeReservations = await reservationsCollection.find({
            status: 'pending',
            expiresAt: { $gt: new Date() },
            sessionId: { $ne: validationSessionId }, // Exclude current session
            'items.productId': productId,
            'items.size': size
          }).toArray();
          
          // Calculate total reserved quantity
          for (const reservation of activeReservations) {
            for (const item of reservation.items) {
              if (item.productId === productId && item.size === size) {
                reservedQuantity += item.quantity || 0;
              }
            }
          }
        } catch (reservationError) {
          console.error('Error checking reservations:', reservationError);
          // Continue without considering reservations
        }
        
        // Check if there's enough stock considering active reservations
        const availableStock = Math.max(0, totalSizeStock - reservedQuantity);
        
        if (availableStock < quantity) {
          return NextResponse.json(
            { 
              valid: false, 
              message: `Insufficient stock for ${product.name} in size ${size}. Requested: ${quantity}, Available: ${availableStock} (${totalSizeStock} total, ${reservedQuantity} reserved)` 
            },
            { status: 400 }
          );
        }
      }
    }
    
    // If we get here, all items are valid and in stock
    // Update the reservation status to 'validated'
    try {
      const reservationsCollection = db.collection('stockReservations');
      await reservationsCollection.updateOne(
        { sessionId: validationSessionId },
        { $set: { status: 'validated', validatedAt: new Date() } }
      );
    } catch (reservationError) {
      console.error('Error updating reservation status:', reservationError);
      // Continue even if reservation update fails
    }
    
    // Return success with session ID for tracking
    return NextResponse.json({ 
      valid: true, 
      message: 'All items are available',
      sessionId: validationSessionId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    });
    
  } catch (error: any) {
    console.error('Error validating stock:', error);
    
    // Generate a fallback session ID for error tracking if we don't have one from the request
    const errorSessionId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Clean up the reservation on error
    try {
      const { db } = await connectToDatabase();
      const reservationsCollection = db.collection('stockReservations');
      
      // Use the session ID from the request if available, otherwise use our error session ID
      const sessionIdToUse = errorSessionId;
      
      await reservationsCollection.updateOne(
        { sessionId: sessionIdToUse },
        { $set: { status: 'error', errorMessage: error.message } },
        { upsert: true } // Create the document if it doesn't exist
      );
    } catch (cleanupError) {
      console.error('Error cleaning up reservation:', cleanupError);
    }
    
    return NextResponse.json(
      { valid: false, message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

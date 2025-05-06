import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';

/**
 * GET /api/products/blacklist/load
 * Loads the blacklist from the database
 */
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const blacklistCollection = db.collection('product_blacklist');
    
    // Get all blacklisted product IDs
    const blacklistedProducts = await blacklistCollection.find({}).toArray();
    
    // Extract just the product IDs
    const blacklistedIds = blacklistedProducts.map(item => item.productId);
    
    // Add the default problematic IDs if they're not already in the list
    const defaultIds = [
      '6819b110064b2eeffa2c1941',  // Original problematic ID
      '6819a258828e01d7e7d17e95',  // Second problematic ID
      '681a4def311e3be5855f56aa',  // Third problematic ID
      '681a5092498f3fc2f026f310'   // Fourth problematic ID from user's screenshot
    ];
    
    // Combine default IDs with database IDs (without duplicates)
    const combinedArray = [...defaultIds, ...blacklistedIds];
    const allBlacklistedIds = Array.from(new Set(combinedArray));
    
    return NextResponse.json({
      success: true,
      blacklist: allBlacklistedIds
    });
  } catch (error: any) {
    console.error('Error loading blacklist:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to load blacklist',
        // Return the default IDs as a fallback
        blacklist: [
          '6819b110064b2eeffa2c1941',
          '6819a258828e01d7e7d17e95',
          '681a4def311e3be5855f56aa',
          '681a5092498f3fc2f026f310'
        ]
      },
      { status: 500 }
    );
  }
}

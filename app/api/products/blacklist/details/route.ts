import { NextResponse } from 'next/server';
import { getBlacklistWithDetails } from '@/app/utils/productBlacklist';

/**
 * GET /api/products/blacklist/details
 * Returns detailed information about blacklisted products
 */
export async function GET() {
  try {
    // Get detailed blacklist information including product details where available
    const blacklistedProducts = await getBlacklistWithDetails();
    
    // Format the response for the API
    const formattedBlacklist = blacklistedProducts.map(item => ({
      productId: item.productId,
      reason: item.reason || 'Unknown reason',
      blacklistedAt: item.blacklistedAt || new Date(),
      productDetails: item.productDetails || null,
      isInRecycleBin: item.productDetails?.deleted === true
    }));
    
    return NextResponse.json({
      success: true,
      count: formattedBlacklist.length,
      blacklist: formattedBlacklist
    });
  } catch (error: any) {
    console.error('Error fetching blacklist details:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch blacklist details' },
      { status: 500 }
    );
  }
}

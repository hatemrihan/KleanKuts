import { NextResponse } from 'next/server';
import { BLACKLISTED_PRODUCT_IDS } from '@/app/utils/productBlacklist';

/**
 * GET /api/products/blacklist
 * Returns the list of blacklisted product IDs
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      blacklistedIds: BLACKLISTED_PRODUCT_IDS
    });
  } catch (error: any) {
    console.error('Error retrieving product blacklist:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve product blacklist' },
      { status: 500 }
    );
  }
}

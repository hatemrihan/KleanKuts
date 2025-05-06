import { NextResponse } from 'next/server';
import { removeFromBlacklist } from '@/app/utils/productBlacklist';

/**
 * POST /api/products/blacklist/remove
 * Removes a product ID from the blacklist
 * Request body: { productId: string }
 */
export async function POST(request: Request) {
  try {
    const { productId } = await request.json();
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const success = await removeFromBlacklist(productId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Product ${productId} removed from blacklist`
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to remove product from blacklist' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error removing product from blacklist:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to remove product from blacklist' },
      { status: 500 }
    );
  }
}

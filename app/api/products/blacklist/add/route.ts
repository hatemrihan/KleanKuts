import { NextResponse } from 'next/server';
import { addToBlacklist } from '@/app/utils/productBlacklist';

/**
 * POST /api/products/blacklist/add
 * Adds a product ID to the blacklist
 * Request body: { productId: string, reason?: string }
 */
export async function POST(request: Request) {
  try {
    const { productId, reason } = await request.json();
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const success = await addToBlacklist(productId, reason || 'Product deleted');
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Product ${productId} added to blacklist`
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to add product to blacklist' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error adding product to blacklist:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add product to blacklist' },
      { status: 500 }
    );
  }
}

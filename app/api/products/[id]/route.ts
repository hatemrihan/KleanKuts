import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { handleDatabaseError, handleApiError } from '../../../utils/errorHandling';

// Get a single product
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    console.log('Fetching product with ID:', params.id);

    // Try to find by _id first
    let product = await Product.findById(params.id).catch(() => null);

    // If not found by _id, try to find by custom ID field if it exists
    if (!product) {
      product = await Product.findOne({ id: params.id }).catch(() => null);
    }

    if (!product) {
      console.log('Product not found with ID:', params.id);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Found product:', product.title || product.name);
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    
    // Check if it's a database connection error
    if (error.name?.includes('Mongo') || error.message?.includes('connect')) {
      return handleDatabaseError(error);
    }
    
    // Other API errors
    return handleApiError(error);
  }
}

// Delete a product (soft or permanent)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    if (permanent) {
      const result = await Product.findByIdAndDelete(params.id);
      if (!result) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: 'Product permanently deleted successfully' });
    } else {
      const result = await Product.findByIdAndUpdate(params.id, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      if (!result) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: 'Product moved to recycle bin successfully' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// Restore a product from recycle bin
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const result = await Product.findByIdAndUpdate(params.id, {
      $unset: { deleted: "", deletedAt: "" }
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product restored successfully' });
  } catch (error) {
    console.error('Error restoring product:', error);
    return NextResponse.json(
      { error: 'Failed to restore product' },
      { status: 500 }
    );
  }
} 
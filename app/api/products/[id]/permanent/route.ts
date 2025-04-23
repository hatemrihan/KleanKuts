import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import { Product } from '../../../../models/product';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const result = await Product.findByIdAndDelete(params.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Product permanently deleted successfully'
    });
  } catch (error) {
    console.error('Error permanently deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to permanently delete product' },
      { status: 500 }
    );
  }
} 
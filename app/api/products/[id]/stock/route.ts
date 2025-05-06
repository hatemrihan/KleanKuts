import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Try to find the product by MongoDB ObjectId first
    let product;
    try {
      product = await productsCollection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      // If the ID is not a valid ObjectId, try to find by custom ID field
      product = await productsCollection.findOne({ id: id });
    }
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Extract only the stock-related information to keep the response small
    const stockInfo = {
      _id: product._id,
      sizeVariants: product.sizeVariants || [],
      sizes: product.sizes || [],
      success: true
    };
    
    return NextResponse.json(stockInfo);
    
  } catch (error: any) {
    console.error('Error fetching product stock:', error);
    return NextResponse.json(
      { success: false, message: `Error fetching product stock: ${error.message}` },
      { status: 500 }
    );
  }
}

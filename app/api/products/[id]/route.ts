import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { handleDatabaseError, handleApiError } from '../../../utils/errorHandling';
import { addToBlacklist, removeFromBlacklist } from '../../../utils/productBlacklist';
import { normalizeProductFields, ensureCloudinaryImages } from '../../../../lib/adminIntegration';

// Define interfaces for product data
interface ColorVariant {
  color: string;
  hexCode?: string;
  stock: number;
}

interface SizeVariant {
  size: string;
  stock: number;
  colorVariants: ColorVariant[];
}

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder?: boolean;
}

// Get a single product
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    console.log('Fetching product with ID:', params.id);
    
    // Try multiple approaches to find the product
    let product = null;
    
    // 1. Try to find by MongoDB _id first (if it looks like a valid MongoDB ID)
    if (params.id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(params.id).catch(() => null);
      console.log('MongoDB ID lookup result:', product ? 'Found' : 'Not found');
    }
    
    // 2. If not found by _id, try to find by custom ID field
    if (!product) {
      product = await Product.findOne({ id: params.id }).catch(() => null);
      console.log('Custom ID lookup result:', product ? 'Found' : 'Not found');
    }
    
    // 3. Try a case-insensitive title search as a fallback
    if (!product) {
      product = await Product.findOne({ 
        $or: [
          { title: { $regex: new RegExp(params.id, 'i') } },
          { name: { $regex: new RegExp(params.id, 'i') } }
        ]
      }).catch(() => null);
      console.log('Title/name search result:', product ? 'Found' : 'Not found');
    }

    if (!product) {
      console.log('Product not found with ID:', params.id);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Found product:', product.title || product.name);
    
    // Convert to object to make it mutable
    const productObj = product.toObject();
    
    // Normalize the product fields for admin panel compatibility
    const normalizedProduct = normalizeProductFields(productObj);
    
    // Ensure images are using Cloudinary URLs
    const finalProduct = ensureCloudinaryImages(normalizedProduct);
    
    // Ensure the product has sizeVariants properly structured
    if (!finalProduct.sizeVariants || !Array.isArray(finalProduct.sizeVariants) || finalProduct.sizeVariants.length === 0) {
      console.log('Product has no size variants, checking if we can create them from sizes');
      
      // Try to create sizeVariants from sizes if available
      if (finalProduct.sizes && Array.isArray(finalProduct.sizes) && finalProduct.sizes.length > 0) {
        console.log('Creating size variants from sizes array');
        finalProduct.sizeVariants = finalProduct.sizes.map((size: string | SizeStock) => {
          // If size is a string, convert to object
          const sizeObj: SizeStock = typeof size === 'string' 
            ? { size, stock: 10, isPreOrder: false }
            : size;
            
          return {
            size: sizeObj.size,
            stock: sizeObj.stock || 10,
            colorVariants: [{
              color: 'Default',
              stock: sizeObj.stock || 10
            }]
          };
        });
      } else {
        // Create a default size variant
        console.log('Creating default size variant');
        finalProduct.sizeVariants = [{
          size: 'One Size',
          stock: 10,
          colorVariants: [{
            color: 'Default',
            stock: 10
          }]
        }];
      }
    } else {
      // Ensure each size variant has colorVariants
      finalProduct.sizeVariants = finalProduct.sizeVariants.map((sv: any) => {
        if (!sv.colorVariants || !Array.isArray(sv.colorVariants) || sv.colorVariants.length === 0) {
          return {
            ...sv,
            colorVariants: [{
              color: 'Default',
              stock: sv.stock || 10
            }]
          };
        }
        return sv;
      });
    }
    
    console.log('Returning product with size variants:', finalProduct.sizeVariants.length);
    return NextResponse.json({
      product: finalProduct,
      success: true
    });
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
      // Find the product first to get its details
      const product = await Product.findById(params.id);
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Add the product to the blacklist
      await addToBlacklist(params.id, 'Product permanently deleted');
      console.log(`Added product ${params.id} to blacklist due to permanent deletion`);
      
      // Now delete the product
      await Product.findByIdAndDelete(params.id);
      
      return NextResponse.json({ 
        message: 'Product permanently deleted successfully',
        blacklisted: true
      });
    } else {
      // Find the product first to get its details
      const product = await Product.findById(params.id);
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Add the product to the blacklist
      await addToBlacklist(params.id, 'Product moved to recycle bin');
      console.log(`Added product ${params.id} to blacklist due to soft deletion`);
      
      // Now mark the product as deleted
      await Product.findByIdAndUpdate(params.id, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        message: 'Product moved to recycle bin successfully',
        blacklisted: true
      });
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
    
    // Find the product first to get its details
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Remove the product from the blacklist
    await removeFromBlacklist(params.id);
    console.log(`Removed product ${params.id} from blacklist due to restoration`);
    
    // Now restore the product
    await Product.findByIdAndUpdate(params.id, {
      $unset: { deleted: "", deletedAt: "" }
    });

    return NextResponse.json({ 
      message: 'Product restored successfully',
      removedFromBlacklist: true
    });
  } catch (error) {
    console.error('Error restoring product:', error);
    return NextResponse.json(
      { error: 'Failed to restore product' },
      { status: 500 }
    );
  }
} 
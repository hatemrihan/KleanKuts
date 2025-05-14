"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder?: boolean;
  color?: string;
}

interface Product {
  _id: string | object;
  id?: string;
  name: string;
  title?: string;
  price: number;
  images: string[];
  selectedImages?: string[];
  discount?: number;
  variants?: SizeStock[];
  sizes?: SizeStock[];
  sizeVariants?: SizeStock[];
  description?: string;
  totalStock?: number;
  extractedId?: string; // Added for processed IDs
}

// ProductCard component to display individual products
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all product variants
  const allVariants = product.variants || product.sizes || product.sizeVariants || [];

  // Determine if product is pre-order or sold out
  const getStockStatus = () => {
    if (allVariants.length === 0) return null;
    
    const allSoldOut = allVariants.every(variant => 
      typeof variant.stock === 'number' && variant.stock <= 0
    );
    
    if (allSoldOut) {
      return { text: 'SOLD OUT', class: 'bg-black text-white' };
    }
    
    const allPreOrder = allVariants.every(variant => variant.isPreOrder);
    if (allPreOrder) {
      return { text: 'PRE-ORDER', class: 'bg-black text-white' };
    }
    
    return null;
  };

  const stockStatus = getStockStatus();
  
  // Get product images
  const productImages = product.images?.length > 0 
    ? product.images 
    : (product.selectedImages && product.selectedImages.length > 0)
      ? product.selectedImages
      : ['/images/try-image.jpg']; // Fallback image

  return (
    <Link 
      href={`/product/${product._id}`}
      className="group block bg-white dark:bg-gray-800 transition-shadow hover:shadow-lg cursor-pointer"
      style={{ borderRadius: 0 }}
    >
      {/* Product Images */}
      <div className="aspect-[3/4] relative overflow-hidden" style={{ borderRadius: 0 }}>
        <Image
          src={(productImages && productImages[currentImageIndex]) || '/images/try-image.jpg'}
          alt={`${product.name} - Image ${currentImageIndex + 1}`}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          priority={true}
          unoptimized={true}
        />
        {/* Status Badge */}
        {stockStatus && (
          <div className="absolute top-3 right-3 z-20 bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-semibold" style={{ borderRadius: 0 }}>
            {stockStatus.text}
          </div>
        )}
      </div>
      {/* Product Info */}
      <div className="p-4" style={{ borderRadius: 0 }}>
        <h3 className="text-lg font-light text-black dark:text-white mb-2">{product.name || product.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-black dark:text-white">L.E {product.price}</span>
        </div>
      </div>
    </Link>
  );
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch products from the API
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products', {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products loaded from API:', data.length);
        
        // Deeply inspect and process the products to ensure proper IDs
        if (Array.isArray(data)) {
          // Log the first product for debugging
          console.log('Raw product data example:', JSON.stringify(data[0]));
          
          // Map through products and ensure each has a valid ID
          const processedProducts = data.map((product, idx) => {
            if (!product) return null;
            
            // Try to get the product ID from different possible locations
            let productId = null;
            if (typeof product._id === 'string') {
              productId = product._id;
            } else if (typeof product._id === 'object' && product._id && product._id.$oid) {
              // MongoDB ObjectId format
              productId = product._id.$oid;
            } else if (product.id) {
              productId = product.id;
            }
            
            // Add a console log with detailed information
            console.log(`Product ${idx}:`, {
              name: product.name || product.title || 'unnamed',
              rawId: product._id,
              processedId: productId,
              hasImages: !!product.images?.length,
              price: product.price
            });
            
            // Add the extracted ID back to the product
            return {
              ...product,
              extractedId: productId
            };
          }).filter(Boolean); // Remove any null values
          
          console.log(`Processed ${processedProducts.length} products`);
          setProducts(processedProducts);
        } else {
          console.error('API did not return an array of products');
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  return (
    <section className="w-full bg-white dark:bg-black py-16 px-4 md:px-8">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-light mb-2 text-center tracking-widest text-black dark:text-white">EXPLORE OUR PRODUCTS</h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex justify-center items-center py-20">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Horizontal Scrollable Products Row */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto gap-12 pb-4 scrollable-x items-stretch">
            {products.map((product, index) => (
              <Link
                key={product.extractedId || `product-${index}`}
                href={product.extractedId ? `/product/${product.extractedId}` : `/collection`}
                className="flex flex-col items-center min-w-[260px] max-w-[320px] mx-auto group cursor-pointer"
                style={{ flex: '0 0 auto' }}
              >
                <div className="relative w-full aspect-[3/4] flex items-center justify-center">
                  <Image
                    src={(product.images?.[0] || product.selectedImages?.[0] || '/images/try-image.jpg')}
                    alt={product.name || product.title || 'Product'}
                    fill
                    className="object-contain"
                    unoptimized={true}
                  />
                </div>
                <div className="w-full mt-6">
                  <div className="text-xs md:text-sm tracking-widest mb-1 text-black/80 dark:text-white/80 group-hover:underline">
                    {(product.name || product.title || 'Product').toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2 text-black/80 dark:text-white/80">
                    <span className="text-base md:text-lg">{product.price} L.E</span>
                    {(product.variants || product.sizes || []).every(variant => variant.isPreOrder) && (
                      <span className="text-xs font-semibold text-black dark:text-white border border-black dark:border-white px-2 py-1 ml-2">PRE-ORDER</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Scroll indicator */}
          <div className="w-full flex justify-end">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 pr-2 pb-1 select-none" style={{letterSpacing: '0.1em'}}>
              scroll <span style={{fontSize: '1.2em', lineHeight: 1}}>→</span>
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

export default Products

"use client"

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder?: boolean;
  color?: string;
}

interface Product {
  _id: string;
  name?: string;
  title?: string;
  price: number;
  images?: string[];
  selectedImages?: string[];
  category?: string;
  variants?: any[];
  sizes?: any[];
  sizeVariants?: any[];
  discount?: number;
  description?: string;
  extractedId?: string; // Added for processed IDs
  gender?: string; // Added gender property
  stockStatus?: {
    status: string;
    hasStock: boolean;
    totalStock: number;
  };
  isOutOfStock?: boolean;
}

// ProductCard component to display individual products
const ProductCard: React.FC<{ product: Product, index: number }> = ({ product, index }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all product variants
  const allVariants = product.variants || product.sizes || product.sizeVariants || [];

  // Determine if product is pre-order or sold out using admin API data
  const getStockStatus = () => {
    // New logic to check the admin API format
    function isProductOutOfStock(product: Product) {
      // Check sizeVariants first (primary method from admin API)
      if (product.variants && Array.isArray(product.variants)) {
        let totalStock = 0;

        product.variants.forEach((sizeVariant: any) => {
          if (sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants)) {
            sizeVariant.colorVariants.forEach((colorVariant: any) => {
              totalStock += (colorVariant.stock || 0);
            });
          }
        });

        return totalStock === 0;
      }

      // Also check if the product has sizeVariants (direct from admin API)
      if ((product as any).sizeVariants && Array.isArray((product as any).sizeVariants)) {
        let totalStock = 0;

        (product as any).sizeVariants.forEach((sizeVariant: any) => {
          if (sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants)) {
            sizeVariant.colorVariants.forEach((colorVariant: any) => {
              totalStock += (colorVariant.stock || 0);
            });
          }
        });

        return totalStock === 0;
      }

      // Check enhanced admin API fields if available
      if (product.stockStatus) {
        if (product.isOutOfStock || product.stockStatus.status === 'out-of-stock' || !product.stockStatus.hasStock) {
          return true;
        }
      }

      // Fallback to legacy stock field and local variant checking
      if ((product as any).stock !== undefined) {
        return ((product as any).stock || 0) === 0;
      }

      // Local variants checking (for fallback products)
      if (allVariants.length === 0) return false;
      
      const allSoldOut = allVariants.every(variant => 
        typeof variant.stock === 'number' && variant.stock <= 0
      );
      
      return allSoldOut;
    }

    // Check if product is out of stock using the new logic
    if (isProductOutOfStock(product)) {
      return { text: 'SOLD OUT', class: 'bg-black text-white' };
    }

    // Check for low stock (enhanced admin API)
    if (product.stockStatus?.status === 'low-stock') {
      return { text: 'LOW STOCK', class: 'bg-orange-500 text-white' };
    }
    
    // Check for pre-order (local variants)
    if (allVariants.length > 0) {
      const allPreOrder = allVariants.every(variant => variant.isPreOrder);
      if (allPreOrder) {
        return { text: 'PRE-ORDER', class: 'bg-black text-white' };
      }
    }
    
    return null;
  };

  const stockStatus = getStockStatus();
  
  // Get product images
  const productImages = product.images?.length ? product.images : 
                       (product.selectedImages?.length ? product.selectedImages : ['/images/try-image.jpg']);

  // Animation variants for the product card
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="flex-none"
    >
      <Link 
        href={`/product/${product._id}`}
        className="group block bg-white dark:bg-black transition-shadow hover:shadow-lg cursor-pointer"
        style={{ borderRadius: 0 }}
      >
        {/* Product Images */}
        <div className="aspect-[3/4] relative overflow-hidden" style={{ borderRadius: 0, width: '220px' }}>
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
            <div className="absolute top-3 right-3 z-20 bg-black dark:bg-white text-white dark:text-black px-2 py-1 text-xs font-medium rounded-sm shadow-sm">
              {stockStatus.text}
            </div>
          )}
          
          {/* Tags container - positioned at top left */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {/* Discount tag - smaller and enhanced design */}
            {product.discount && product.discount > 0 && (
              <div className="bg-black text-white px-2 py-1 text-xs font-medium rounded-sm shadow-sm">
                {product.discount}% OFF
              </div>
            )}
            
            {/* Gender tag when available */}
            {product.gender && (
              <div className="bg-black text-white px-2 py-1 text-xs font-medium rounded-sm shadow-sm">
                {product.gender}
              </div>
            )}
          </div>
        </div>
        {/* Product Info */}
        <div className="p-4" style={{ borderRadius: 0, width: '220px' }}>
          <h3 className="text-lg font-light text-black dark:text-white mb-2">{product.name || product.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-black dark:text-white">L.E {typeof product.price === 'number' ? product.price : ''}</span>
            {product.discount && product.discount > 0 && (
              <span className="text-gray-500 line-through text-sm">L.E {typeof product.price === 'number' ? product.price : ''}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  // Animation variants for the heading
  const headingVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  // Animation variants for the products container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

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
            
            // Add the extracted ID back to the product and handle discount
            return {
              ...product,
              extractedId: productId,
              discount: product.discount && product.discount > 0 ? product.discount : undefined
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
    <section 
      ref={sectionRef}
      className="w-full bg-white dark:bg-black py-16 px-4 md:px-8"
    >
      {/* Section Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <motion.h2 
          className="text-3xl md:text-4xl font-light mb-2 text-center tracking-widest text-black dark:text-white"
          variants={headingVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          EXPLORE OUR PRODUCTS
        </motion.h2>
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

      {/* Horizontal Scrollable Products Row - Better Centered */}
      {!loading && !error && (
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Wrapper with padding for better centering */}
          <div className="px-[10%] md:px-[15%] lg:px-[20%]">
            <div className="flex overflow-x-auto gap-8 pb-4 scrollable-x items-stretch">
              {products.map((product, index) => (
                <ProductCard 
                  key={product.extractedId || `product-${index}`} 
                  product={product} 
                  index={index}
                />
              ))}
            </div>
          </div>
          {/* Scroll indicator */}
          <div className="w-full flex justify-end">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 pr-2 pb-1 select-none" style={{letterSpacing: '0.1em'}}>
              scroll <span style={{fontSize: '1.2em', lineHeight: 1}}>→</span>
            </span>
          </div>
        </motion.div>
      )}
    </section>
  )
}

export default Products

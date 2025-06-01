"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '../sections/nav';
import Footer from '../sections/footer';
import { optimizeCloudinaryUrl, processImageUrl } from '../utils/imageUtils';
import NewFooter from '../sections/NewFooter';

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder: boolean;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category?: string;
  categories?: string[];
  discount?: number;
  description: string;
  Material?: string[];
  sizes: SizeStock[];
  gender?: string;
}

interface MongoDBProduct {
  _id: string;
  id?: string;
  title?: string;
  selectedImages?: string[];
  categories?: string[];
  price?: number;
  discount?: number;
  description?: string;
  selectedSizes?: SizeStock[];
  gender?: string;
}

// Your actual product IDs
const localProducts = {
  1: {
    _id: "1",
    name: '01 Sage set in Rich brown',
    price: 1300,
    images: [
      '/images/model-image.jpg',
      '/images/modeltwo-image.jpg',
      '/images/modelthree-image.jpg',
      '/images/modelfour-image.jpg'
    ],
    description: 'Experience the perfect blend of luxury and ease with this Rich Brown French linen set. Naturally breathable, and effortlessly elegant, it brings warmth and refinement to any setting.',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ],
    category: 'sets'
  },
  2: {
    _id: "2",
    name: '02 Sage set in light beige',
    price: 1300,
    images: [
      '/images/malak-image.jpg',
      '/images/malakfour-image.jpg',
      '/images/malakthree-image.jpg',
      '/images/malak-image.jpg'
    ],
    description: 'Experience the perfect blend of luxury and ease with this Rich Brown French linen set. Naturally breathable, and effortlessly elegant, it brings warmth and refinement to any setting.',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 7, isPreOrder: false },
      { size: 'M', stock: 20, isPreOrder: false }
    ],
    category: 'sets'
  },
  3: {
    _id: "3",
    name: 'Sage top in Rich brown',
    price: 700,
    images: [
      '/images/modeleight-image.jpg',
      '/images/modelnine-image.jpg'
    ],
    description: 'Effortlessly chic and breathable, this Rich Brown French linen top offers a perfect balance of comfort and elegance. Its timeless design and natural texture make it a versatile wardrobe essential',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 9, isPreOrder: false },
      { size: 'M', stock: 13, isPreOrder: false }
    ],
    category: 'tops'
  },
  4: {
    _id: "4",
    name: 'Sage top in light beige',
    price: 700,
    images: [
     '/images/malakfive-image.jpg',
      '/images/malaksix-image.jpg',
      '/images/malaktwo-image.jpg',
      '/images/malakthree-image.jpg'
    ],
    description: 'Effortlessly chic and breathable, this Rich Brown French linen top offers a perfect balance of comfort and elegance. Its timeless design and natural texture make it a versatile wardrobe essential',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ],
    category: 'tops'
  },
  5: {
    _id: "5",
    name: 'Sage pants in rich brown',
    price: 600,
    images: [
      '/images/pantmodel-image.jpg',
      '/images/pantmodeltwo-image.jpg',
      '/images/pantmodelthree-image.jpg',
      '/images/pantmodelfour-image.jpg',
      '/images/pantmodelfive-image.jpg'
    ],
    description: "Designed for effortless style and comfort, these rich brown French linen pants offer a relaxed yet refined fit. Lightweight, breathable, and timeless, they're perfect for any occasion",
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ],
    category: 'pants'
  },
  6: {
    _id: "6",
    name: 'Sage pants in light beige',
    price: 600,
    images: [
      '/images/malakpant-image.jpg',
      '/images/pantmalaktwo-image.jpg',
      '/images/pantmalakthree-image.jpg'
    ],
    description: "Designed for effortless style and comfort, these rich brown French linen pants offer a relaxed yet refined fit. Lightweight, breathable, and timeless, they're perfect for any occasion",
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ],
    category: 'pants'
  }
};

export default function Collection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: MongoDBProduct[] = await response.json();
        console.log('MongoDB products:', data);
        
        // Ensure MongoDB products have all required fields
        const processedMongoProducts = data.map((product: MongoDBProduct) => {
          // Ensure we have a valid _id
          const productId = product._id || product.id;
          if (!productId) {
            console.error('Product missing ID:', product);
            return null;
          }

          // Log the product data for debugging
          console.log('Processing product:', product);

          const processedProduct: Product = {
            _id: product._id || product.id || productId, // Support both _id and id fields
            name: (product.title || 'Untitled Product').replace(/\s*\b[0-9a-fA-F]{24}\b\s*/g, '').trim(),
            images: product.selectedImages?.map(img => processImageUrl(img)) || [],
            category: product.categories?.[0] || 'other',
            categories: product.categories || [],
            price: product.price || 0,
            discount: product.discount && product.discount > 0 ? product.discount : undefined,
            description: product.description || '',
            sizes: product.selectedSizes || [],
            gender: product.gender || ''
          };

          return processedProduct;
        }).filter((product): product is Product => product !== null);
        
        // Only use MongoDB products if we have them, don't mix with local products
        let productsToUse: Product[] = [];
        if (processedMongoProducts.length > 0) {
          console.log('Using real products from MongoDB:', processedMongoProducts.length);
          productsToUse = processedMongoProducts;
        } else {
          // Fall back to local products only if no MongoDB products are available
          const localProductsArray = Object.values(localProducts);
          console.log('Falling back to local products:', localProductsArray.length);
          productsToUse = localProductsArray;
        }
        
        // Calculate dynamic max price based on actual product data
        const highestPrice = productsToUse.reduce((max, product) => {
          const price = product.price || 0;
          return price > max ? price : max;
        }, 0);
        
        // Set max price with some buffer (20% more than the highest price)
        const bufferedMaxPrice = Math.ceil(highestPrice * 1.2);
        const roundedMaxPrice = Math.ceil(bufferedMaxPrice / 1000) * 1000; // Round up to nearest thousand
        
        console.log(`Highest product price: ${highestPrice}, setting max range to: ${roundedMaxPrice}`);
        setMaxPrice(roundedMaxPrice);
        setPriceRange([0, roundedMaxPrice]);
        
        setProducts(productsToUse);
        
        console.log('Final products count:', productsToUse.length);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setProducts(Object.values(localProducts));
        
        // Provide more specific error messages based on the error type
        if (err.message?.includes('fetch') || err.message?.includes('network')) {
          setError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
        } else if (err.message?.includes('database') || err.message?.includes('MongoDB') || 
                  (typeof err.message === 'string' && err.message.toLowerCase().includes('mongo'))) {
          setError('Database connection error: The product database is currently unavailable. We\'re showing locally stored products instead.');
        } else {
          setError('Some products might not be available at the moment. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get unique categories from all products
  const categories = ['All'];

  // Filter products based on the admin categories, gender, and price range
  const filteredProducts = products.filter(product => {
    // Price range filter
    const productPrice = product.discount 
      ? product.price - (product.price * product.discount / 100) 
      : product.price;
    
    if (productPrice < priceRange[0] || productPrice > priceRange[1]) {
      return false;
    }
    
    // Gender filter
    if (selectedGender !== 'All') {
      if (!product.gender) return false;
      
      const productGender = product.gender.toLowerCase();
      const filterGender = selectedGender.toLowerCase();
      
      if (filterGender === 'men' && productGender !== 'men') {
        return false;
      }
      
      if (filterGender === 'women' && productGender !== 'woman' && productGender !== 'women') {
        return false;
      }
    }
    
    // Category filter - skip if 'All' is selected
    if (selectedCategory === 'All') return true;
    
    // Check if product has the selected category in its categories array
    if (product.categories && product.categories.length > 0) {
      // More flexible matching for categories
      return product.categories.some(cat => {
        if (!cat) return false;
        if (cat === selectedCategory) return true;
        if (cat.toUpperCase() === selectedCategory.toUpperCase()) return true;
        
        // Handle partial matches based on the core category name
        const selectedCategoryLower = selectedCategory.toLowerCase();
        if (selectedCategoryLower === 'sage sets' && cat.toLowerCase().includes('set')) return true;
        if (selectedCategoryLower === 'sage tops' && 
            (cat.toLowerCase().includes('top') || cat.toLowerCase() === 'sage top')) return true;
        if (selectedCategoryLower === 'sage pants' && cat.toLowerCase().includes('pant')) return true;
        
        return false;
      });
    }
    
    // Also check the category field with more flexible matching
    if (product.category) {
      if (product.category === selectedCategory) return true;
      if (product.category.toUpperCase() === selectedCategory.toUpperCase()) return true;
      
      // Handle partial matches for single category field
      const categoryLower = product.category.toLowerCase();
      const selectedCategoryLower = selectedCategory.toLowerCase();
      
      if (selectedCategoryLower === 'sage sets' && categoryLower.includes('set')) return true;
      if (selectedCategoryLower === 'sage tops' && 
          (categoryLower.includes('top') || categoryLower === 'sage top')) return true;
      if (selectedCategoryLower === 'sage pants' && categoryLower.includes('pant')) return true;
    }
    
    return false;
  });
  
  console.log('Selected category:', selectedCategory);
  console.log('Filtered products count:', filteredProducts.length);

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white dark:bg-black pt-20 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-light text-black dark:text-white transition-colors duration-300">
              Collection
            </h1>
            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col items-center mb-12">
            {/* Gender Filter */}
            <div className="flex gap-6 overflow-x-auto pb-2 mb-6">
              {['All', 'Men', 'Women'].map((gender) => (
                <button
                  key={gender}
                  className={`px-4 py-2 text-sm whitespace-nowrap ${selectedGender === gender ? 'border-b-2 border-black font-medium' : 'text-gray-500 hover:text-black'}`}
                  onClick={() => setSelectedGender(gender)}
                >
                  {gender}
                </button>
              ))}
            </div>
            
            {/* Only show Categories if we have more than just 'All' */}
            {categories.length > 1 && (
              <div className="flex gap-6 overflow-x-auto pb-2 mb-6">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`px-4 py-2 text-sm whitespace-nowrap ${selectedCategory === category ? 'border-b-2 border-black font-medium' : 'text-gray-500 hover:text-black'}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
            
            {/* Price Range Slider - Enhanced single slider */}
            <div className="w-full max-w-md mx-auto mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Max Price:</span>
                <span className="text-sm font-medium">{priceRange[1]} L.E</span>
              </div>
              <div className="relative">
                <input 
                  type="range" 
                  min={minPrice} 
                  max={maxPrice} 
                  value={priceRange[1]} 
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="mt-2 flex justify-between">
                  <span className="text-xs text-gray-500">{minPrice} L.E</span>
                  <span className="text-xs text-gray-500">{maxPrice} L.E</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading products...</p>
            </div>
          ) : (
            <>
              {/* Desktop Grid (3 or more columns) */}
              <div className="hidden lg:grid lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Tablet/Mobile Grid (2 columns) */}
              <div className="grid grid-cols-2 gap-3 lg:hidden">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} isMobile />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <NewFooter/>
    </>
  );
}

// Separate ProductCard component for cleaner code
const ProductCard = ({ product, isMobile = false }: { product: Product; isMobile?: boolean }) => {
  // Calculate final price if there's a discount
  const finalPrice = product.discount ? product.price - (product.price * product.discount / 100) : product.price;
  const displayPrice = product.discount 
    ? `${finalPrice} L.E` 
    : `${product.price} L.E`;

  const getStockStatus = () => {
    // Only show SOLD OUT if we explicitly know the product is out of stock
    // For products from the admin panel, we'll check if stock is 0 or if it's marked as pre-order
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      // Check if all sizes have zero stock or are pre-order
      const allOutOfStock = product.sizes.every(size => 
        (typeof size.stock === 'number' && size.stock <= 0) || 
        size.isPreOrder === true
      );
      
      if (allOutOfStock) {
        return { text: 'SOLD OUT', class: 'bg-black text-white' };
      }
    }
    return null;
  };

  const stockStatus = getStockStatus();

  // Ensure we have a valid ID for the product link
  const productId = product._id || '';
  console.log(`Product card for: ${product.name}, ID: ${productId}`);
  
  return (
    <Link 
      href={`/product/${productId}`}
      className="group block relative"
    >
      <div className={`aspect-[3/4] w-full overflow-hidden bg-gray-50 dark:bg-black ${isMobile ? 'mb-1' : 'mb-2'} transition-colors duration-300`}>
        {product.images && product.images[0] ? (
          <>
            <Image
              src={optimizeCloudinaryUrl(product.images[0], { width: 500 })}
              alt={product.name}
              width={500}
              height={625}
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              priority={true}
              unoptimized={false}
            />
            {stockStatus && (
              <div className="absolute top-3 right-3 z-20 bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-semibold rounded transition-colors duration-300">
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
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-black transition-colors duration-300">
            <span className="text-gray-400 dark:text-gray-500 transition-colors duration-300">No image available</span>
          </div>
        )}
      </div>
      
      <div className={`text-center ${isMobile ? 'mb-6' : 'mt-4'}`}>
        <h3 className={`text-sm font-light text-black dark:text-white mb-1 ${isMobile ? 'text-xs' : ''} transition-colors duration-300`}>
          {product.name}
        </h3>
        <div className={`font-light ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <span className="text-black dark:text-white transition-colors duration-300">{displayPrice}</span>
          {product.discount && product.discount > 0 && (
            <span className="ml-2 text-gray-500 line-through text-xs">{product.price} L.E</span>
          )}
        </div>
      </div>
    </Link>
  );
};
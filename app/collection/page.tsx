"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '../sections/nav';
import Footer from '../sections/footer';

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
  category: string;
  discount?: number;
  description: string;
  Material?: string[];
  sizes: SizeStock[];
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
      '/images/malakfive-image.jpg',
      '/images/malakfour-image.jpg',
      '/images/malakthree-image.jpg',
      '/images/malak-image.jpg'
    ],
    description: 'Experience the perfect blend of luxury and ease with this Rich Brown French linen set. Naturally breathable, and effortlessly elegant, it brings warmth and refinement to any setting.',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ],
    category: 'sets'
  },
  3: {
    _id: "3",
    name: 'Sage top in Rich brown',
    price: 1000,
    images: [
      '/images/modeleight-image.jpg',
      '/images/modelnine-image.jpg'
    ],
    description: 'Effortlessly chic and breathable, this Rich Brown French linen top offers a perfect balance of comfort and elegance. Its timeless design and natural texture make it a versatile wardrobe essential',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ],
    discount: 30,
    category: 'tops'
  },
  4: {
    _id: "4",
    name: 'Sage top in light beige',
    price: 1000,
    images: [
      '/images/malaksix-image.jpg',
      '/images/malak-image.jpg',
      '/images/malaktwo-image.jpg',
      '/images/malakthree-image.jpg'
    ],
    description: 'Effortlessly chic and breathable, this Rich Brown French linen top offers a perfect balance of comfort and elegance. Its timeless design and natural texture make it a versatile wardrobe essential',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 2, isPreOrder: false },
      { size: 'M', stock: 9, isPreOrder: false }
    ],
    discount: 30,
    category: 'tops'
  },
  5: {
    _id: "5",
    name: 'Sage pants in rich brown',
    price: 1000,
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
    discount: 40,
    category: 'pants'
  },
  6: {
    _id: "6",
    name: 'Sage pants in light beige',
    price: 1000,
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
    discount: 40,
    category: 'pants'
  }
};

export default function Collection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

          const processedProduct: Product = {
            _id: productId,
            name: (product.title || 'Untitled Product').replace(/\s*\b[0-9a-fA-F]{24}\b\s*/g, '').trim(),
            images: product.selectedImages?.map(img => {
              // If it's already a full URL (http or https), use it as is
              if (img.startsWith('http://') || img.startsWith('https://')) {
                return img;
              }
              
              // If it's a local path starting with /images, use it as is
              if (img.startsWith('/images/')) {
                return img;
              }
              
              // For all other cases, assume it's a relative path and construct the full URL
              return `http://localhost:3002/uploads/${img.replace(/^\/+/, '')}`;
            }) || [],
            category: (product.categories?.[0] || 'other').toLowerCase(),
            price: product.price || 0,
            discount: product.discount || 0,
            description: product.description || '',
            sizes: product.selectedSizes || []
          };

          return processedProduct;
        }).filter((product): product is Product => product !== null);
        
        // Convert localProducts object to array
        const localProductsArray = Object.values(localProducts);
        
        // Combine MongoDB products with local products, prioritizing MongoDB data
        const combinedProducts = [...processedMongoProducts, ...localProductsArray];
        
        // Remove duplicates based on _id, keeping MongoDB versions if they exist
        const uniqueProducts = Array.from(
          new Map(combinedProducts.map(item => [item._id, item])).values()
        );

        console.log('Final products:', uniqueProducts);
        setProducts(uniqueProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts(Object.values(localProducts));
        setError('Some products might not be available at the moment. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get unique categories from all products
  const categories = ['all', ...Array.from(new Set(products.map(product => 
    product.category ? product.category.toLowerCase() : 'other'
  )))].filter(category => 
    // Filter out any category that looks like a MongoDB ID (24 character hex string)
    !/^[0-9a-fA-F]{24}$/.test(category)
  );

  const filteredProducts = products.filter(product => 
    selectedCategory === 'all' || product.category?.toLowerCase() === selectedCategory
  );

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white pt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-light text-black">
              Collection
            </h1>
            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Filters */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-6 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-sm font-light tracking-wide whitespace-nowrap relative group
                    ${selectedCategory === category
                      ? 'text-black'
                      : 'text-gray-500 hover:text-black'
                    } transition-colors`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  <span className={`absolute left-0 bottom-0 w-full h-[1px] bg-black transition-transform origin-left
                    ${selectedCategory === category ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                </button>
              ))}
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
      <Footer />
    </>
  );
}

// Separate ProductCard component for cleaner code
const ProductCard = ({ product, isMobile = false }: { product: Product; isMobile?: boolean }) => {
  const displayPrice = product.discount 
    ? `${(product.price * (1 - product.discount/100)).toFixed(0)} EGP`
    : `${product.price} EGP`;

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    size: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  const [selectedSize, setSelectedSize] = useState<string>('');

  const getStockStatus = () => {
    const allPreOrder = product.sizes.every(size => size.isPreOrder);
    if (allPreOrder) {
      return { text: 'SOLD OUT', class: 'bg-black text-white' };
    }
    return null;
  };

  const stockStatus = getStockStatus();

  // Add this function to get stock info text
  const getStockInfoText = (size: SizeStock) => {
    if (size.isPreOrder) return 'Sold out';
    if (size.stock === 0) return 'Out of stock';
    return `${size.stock} ${size.stock === 1 ? 'item' : 'items'} left`;
  };

  const handleBookNow = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    setShowBookingForm(true);
    setBookingError(''); // Clear any previous errors
  };

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      setBookingError('Please enter your name');
      return false;
    }
    if (!customerInfo.email.trim()) {
      setBookingError('Please enter your email');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      setBookingError('Please enter your phone number');
      return false;
    }
    if (!customerInfo.size) {
      setBookingError('Please select a size');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      setBookingError('Please enter a valid email address');
      return false;
    }
    // Phone number validation (assuming Egyptian numbers)
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(customerInfo.phone)) {
      setBookingError('Please enter a valid Egyptian phone number');
      return false;
    }
    return true;
  };

  const submitBooking = async (retryAttempt = 0): Promise<boolean> => {
    try {
      // Find the selected size's current stock
      const selectedSizeInfo = product.sizes.find(s => s.size === customerInfo.size);
      if (!selectedSizeInfo) {
        throw new Error('Selected size not found');
      }

      // If it's not a pre-order item, check stock
      if (!selectedSizeInfo.isPreOrder && selectedSizeInfo.stock <= 0) {
        setBookingError('Sorry, this size is now out of stock');
        return false;
      }

      const orderData = {
        firstName: customerInfo.name.split(' ')[0],
        lastName: customerInfo.name.split(' ').slice(1).join(' ') || '-',
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: 'Pre-order - No address required',
        apartment: '-',
        city: '-',
        notes: selectedSizeInfo.isPreOrder 
          ? `PRE-ORDER BOOKING\nProduct: ${product.name}\nSize: ${customerInfo.size}\nCustomer Name: ${customerInfo.name}\nContact: ${customerInfo.phone} | ${customerInfo.email}\nStatus: Awaiting product availability`
          : `REGULAR ORDER\nProduct: ${product.name}\nSize: ${customerInfo.size}\nCustomer Name: ${customerInfo.name}\nContact: ${customerInfo.phone} | ${customerInfo.email}`,
        products: [{
          id: product._id,
          name: selectedSizeInfo.isPreOrder ? `[PRE-ORDER] ${product.name}` : product.name,
          price: product.discount 
            ? (product.price * (1 - product.discount/100))
            : product.price,
          quantity: 1,
          size: customerInfo.size,
          image: product.images[0],
          discount: product.discount || 0
        }],
        total: product.discount 
          ? (product.price * (1 - product.discount/100))
          : product.price,
        status: selectedSizeInfo.isPreOrder ? 'pending' : 'processing'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
      }

      // If it's not a pre-order item, update the local stock count
      if (!selectedSizeInfo.isPreOrder) {
        const updatedSizes = product.sizes.map(size => {
          if (size.size === customerInfo.size) {
            return { ...size, stock: size.stock - 1 };
          }
          return size;
        });
        product.sizes = updatedSizes;
      }

      return true;
    } catch (error) {
      console.error('Booking attempt failed:', error);
      if (retryAttempt < MAX_RETRIES) {
        setBookingError(`Attempt ${retryAttempt + 1}/${MAX_RETRIES} failed. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return submitBooking(retryAttempt + 1);
      }
      throw error;
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await submitBooking();
      if (success) {
        setShowBookingForm(false);
        setShowThankYou(true);
        // Reset form
        setCustomerInfo({
          name: '',
          email: '',
          phone: '',
          size: ''
        });
        setTimeout(() => {
          setShowThankYou(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Final booking error:', error);
      setBookingError(
        'Unable to complete your booking at this time. Please try again later or contact our support.'
      );
    } finally {
      setIsSubmitting(false);
      setRetryCount(0);
    }
  };

  return (
    <>
      <Link 
        href={stockStatus ? '#' : `/product/${product._id}`}
        onClick={stockStatus ? handleBookNow : undefined} 
        className="group block relative"
      >
        <div className={`aspect-[3/4] w-full overflow-hidden bg-gray-50 ${isMobile ? 'mb-1' : 'mb-2'}`}>
          {product.images && product.images[0] ? (
            <>
              <Image
                src={product.images[0]}
                alt={product.name}
                width={500}
                height={625}
                className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                priority={true}
                unoptimized={true}
              />
              {stockStatus && (
                <div className={`absolute top-2 right-2 px-2 py-1 text-xs ${stockStatus.class}`}>
                  {stockStatus.text}
                </div>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>
        
        <div className={`text-center ${isMobile ? 'mb-6' : 'mt-4'}`}>
          <h3 className={`text-sm font-light text-black mb-1 ${isMobile ? 'text-xs' : ''}`}>
            {product.name}
          </h3>
          <div className={`font-light ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {product.discount ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-black">{displayPrice}</span>
                <span className="text-gray-400 line-through">
                  {product.price} EGP
                </span>
              </div>
            ) : (
              <span className="text-black">{displayPrice}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light">{product.name}</h2>
              <button 
                onClick={() => setShowBookingForm(false)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Size Guide and Shipping Info */}
            <div className="mb-6 space-y-4 border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-light">Size Guide</h3>
                <div className="text-sm text-gray-500">
                  <p>Small fits from 50 to 58 kgs</p>
                  <p>Medium from 59 to 70 kgs</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-light">Shipping</h3>
                <p className="text-sm text-gray-500">
                  {product.sizes.every(s => s.isPreOrder) 
                    ? 'Ships in 10-14 days when available'
                    : 'Ships in 2-3 business days'}
                </p>
              </div>
            </div>
            
            {bookingError && (
              <div className="mb-4 p-3 bg-red-50 text-red-500 rounded">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleSubmitBooking} className="space-y-6">
              {/* Size Selection */}
              <div>
                <label className="block text-sm mb-1">Size</label>
                <div className="grid grid-cols-2 gap-4">
                  {product.sizes.map(size => (
                    <button
                      key={size.size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size.size);
                        setCustomerInfo({...customerInfo, size: size.size});
                      }}
                      className={`relative p-4 text-left border rounded-lg transition-all ${
                        customerInfo.size === size.size
                          ? 'border-black ring-1 ring-black'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="block text-lg mb-1">{size.size}</span>
                      <span className={`block text-sm ${
                        size.isPreOrder ? 'text-blue-600' :
                        size.stock === 0 ? 'text-red-500' :
                        'text-green-600'
                      }`}>
                        {size.isPreOrder ? 'Pre-order' :
                         size.stock === 0 ? 'Out of stock' :
                         `${size.stock} left`}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedSize && !product.sizes.find(s => s.size === selectedSize)?.isPreOrder && (
                  <p className="mt-2 text-sm text-gray-600">
                    {product.sizes.find(s => s.size === selectedSize)?.stock} items available
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white text-black p-2 rounded border border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
                  value={customerInfo.name}
                  onChange={(e) => {
                    setBookingError('');
                    setCustomerInfo({...customerInfo, name: e.target.value});
                  }}
                  disabled={isSubmitting}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-white text-black p-2 rounded border border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
                  value={customerInfo.email}
                  onChange={(e) => {
                    setBookingError('');
                    setCustomerInfo({...customerInfo, email: e.target.value});
                  }}
                  disabled={isSubmitting}
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-white text-black p-2 rounded border border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
                  value={customerInfo.phone}
                  onChange={(e) => {
                    setBookingError('');
                    setCustomerInfo({...customerInfo, phone: e.target.value});
                  }}
                  disabled={isSubmitting}
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-4 py-2 border border-black hover:bg-gray-100 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-900 disabled:bg-gray-400 relative"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Book Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-2xl font-light mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-6">Your booking has been confirmed successfully. We will contact you when the item is back in stock.</p>
            <button
              onClick={() => setShowThankYou(false)}
              className="px-6 py-2 bg-black text-white hover:bg-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
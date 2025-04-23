"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  discount?: number;
  sizes: SizeStock[];
}

// Updated product data with size-specific stock information
const products: Product[] = [
  {
    id: 1,
    name: '01 Sage set in Rich brown',
    price: 1300,
    images: [
      '/images/model-image.jpg',
      '/images/modeltwo-image.jpg',
      '/images/modelthree-image.jpg',
      '/images/modelfour-image.jpg'
    ],
    sizes: [
      { size: 'Small', stock: 0, isPreOrder: true },
      { size: 'Medium', stock: 0, isPreOrder: true }
    ]
  },
  {
    id: 2,
    name: '02 Sage set in light beige',
    price: 1300,
    images: [
      '/images/malak-image.jpg',
      '/images/malaktwo-image.jpg',
      '/images/malakthree-image.jpg',
      '/images/malakfour-image.jpg',
      '/images/malakfive-image.jpg',
      '/images/malaksix-image.jpg'
    ],
    sizes: [
      { size: 'Small', stock: 0, isPreOrder: true },
      { size: 'Medium', stock: 0, isPreOrder: true }
    ]
  },
  {
    id: 3,
    name: 'Sage top in Rich brown',
    price: 1000,
    images: [
      '/images/modelsix-image.jpg',
      '/images/modeleight-image.jpg',
      '/images/modelseven-image.jpg',
      '/images/modelnine-image.jpg'
    ],
    discount: 30,
    sizes: [
      { size: 'Small', stock: 0, isPreOrder: true },
      { size: 'Medium', stock: 0, isPreOrder: true }
    ]
  },
  {
    id: 4,
    name: 'Sage top in light beige',
    price: 1000,
    images: [
      '/images/malakfive-image.jpg',
      '/images/malaksix-image.jpg',
      '/images/malakthree-image.jpg'
    ],
    discount: 30,
    sizes: [
      { size: 'Small', stock: 2, isPreOrder: false },
      { size: 'Medium', stock: 9, isPreOrder: false }
    ]
  },
  {
    id: 5,
    name: 'Sage pants in rich brown',
    price: 1000,
    images: [
      '/images/pantmodel-image.jpg',
      '/images/pantmodeltwo-image.jpg',
      '/images/pantmodelthree-image.jpg',
      '/images/pantmodelfour-image.jpg',
      '/images/pantmodelfive-image.jpg'
    ],
    discount: 40,
    sizes: [
      { size: 'Small', stock: 0, isPreOrder: true },
      { size: 'Medium', stock: 0, isPreOrder: true }
    ]
  },
  {
    id: 6,
    name: 'Sage pants in light beige',
    price: 1000,
    images: [
      '/images/malakpant-image.jpg',
      '/images/pantmalaktwo-image.jpg',
      '/images/pantmalakthree-image.jpg'
    ],
    discount: 40,
    sizes: [
      { size: 'Small', stock: 0, isPreOrder: true },
      { size: 'Medium', stock: 0, isPreOrder: true }
    ]
  }
];

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingInfo, setBookingInfo] = useState({
    name: '',
    email: '',
    phone: '',
    size: ''
  });
  const [selectedSize, setSelectedSize] = useState<string>('');

  const getStockStatus = () => {
    const allPreOrder = product.sizes.every(size => size.isPreOrder);
    const hasStock = product.sizes.some(size => size.stock > 0);
    
    if (allPreOrder) {
      return { text: 'SOLD OUT', class: 'bg-black' };
    } else if (!hasStock) {
      return { text: 'SOLD OUT', class: 'bg-gray-600' };
    }
    return null;
  };

  const stockStatus = getStockStatus();
  const isPreOrder = product.sizes.every(size => size.isPreOrder);

  const getStockInfoText = (size: SizeStock) => {
    if (size.isPreOrder) return 'Sold out';
    if (size.stock === 0) return 'Out of stock';
    return `${size.stock} ${size.stock === 1 ? 'item' : 'items'} left`;
  };

  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Find the selected size's current stock
    const selectedSize = product.sizes.find(s => s.size === bookingInfo.size);
    if (!selectedSize) {
      alert('Please select a valid size');
      return;
    }

    // Check stock for non-pre-order items
    if (!selectedSize.isPreOrder && selectedSize.stock <= 0) {
      alert('Sorry, this size is now out of stock');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate the discounted price if applicable
      const finalPrice = product.discount 
        ? product.price * (1 - product.discount/100)
        : product.price;

      const orderData = {
        firstName: bookingInfo.name.split(' ')[0],
        lastName: bookingInfo.name.split(' ').slice(1).join(' ') || '-',
        email: bookingInfo.email,
        phone: bookingInfo.phone,
        address: 'Pre-order - No address required',
        apartment: '-',
        city: '-',
        notes: selectedSize.isPreOrder
          ? `PRE-ORDER BOOKING
Product: ${product.name}
Size: ${bookingInfo.size}
Customer Name: ${bookingInfo.name}
Contact: ${bookingInfo.phone} | ${bookingInfo.email}
Status: Awaiting product availability`
          : `REGULAR ORDER
Product: ${product.name}
Size: ${bookingInfo.size}
Customer Name: ${bookingInfo.name}
Contact: ${bookingInfo.phone} | ${bookingInfo.email}`,
        products: [{
          id: product.id,
          name: selectedSize.isPreOrder ? `[PRE-ORDER] ${product.name}` : product.name,
          price: finalPrice,
          quantity: 1,
          size: bookingInfo.size,
          image: product.images[0],
          discount: product.discount || 0
        }],
        total: finalPrice,
        status: selectedSize.isPreOrder ? 'pending' : 'processing'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      // Update local stock if it's not a pre-order item
      if (!selectedSize.isPreOrder) {
        const updatedSizes = product.sizes.map(size => {
          if (size.size === bookingInfo.size) {
            return { ...size, stock: size.stock - 1 };
          }
          return size;
        });
        product.sizes = updatedSizes;
      }

      setShowBookingForm(false);
      setShowThankYou(true);
      setBookingInfo({ name: '', email: '', phone: '', size: '' });
    } catch (error) {
      console.error('Booking error:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <Link 
        href={isPreOrder ? '#' : `/product/${product.id}`}
        onClick={(e) => {
          if (isPreOrder) {
            e.preventDefault();
            setShowBookingForm(true);
          }
        }}
        className="group relative block bg-gray-100 overflow-hidden"
      >
        {/* Product Images */}
        <div className="aspect-[3/4] relative overflow-hidden">
          <Image
            src={product.images[currentImageIndex]}
            alt={`${product.name} - Image ${currentImageIndex + 1}`}
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            priority={product.id <= 3}
          />
          
          {/* Image Thumbnails */}
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Status Badge */}
          {stockStatus && (
            <div className={`absolute top-4 right-4 ${stockStatus.class} text-white text-sm px-3 py-1 rounded-sm`}>
              {stockStatus.text}
            </div>
          )}
          
          {/* Discount Badge */}
          {product.discount && !stockStatus && (
            <div className="absolute top-4 right-4 bg-red-500 text-white text-sm px-3 py-1 rounded-sm">
              -{product.discount}%
            </div>
          )}

          {/* Navigation Arrows */}
          {product.images.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/50"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIndex((prev) => 
                    prev === 0 ? product.images.length - 1 : prev - 1
                  );
                }}
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/50"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIndex((prev) => 
                    prev === product.images.length - 1 ? 0 : prev + 1
                  );
                }}
                aria-label="Next image"
              >
                →
              </button>
            </>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-lg font-light text-black mb-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            {product.discount ? (
              <>
                <span className="text-red-500">L.E {(product.price * (1 - product.discount/100)).toFixed(0)}</span>
                <span className="text-gray-400 line-through text-sm">L.E {product.price}</span>
              </>
            ) : (
              <span className="text-black">L.E {product.price}</span>
            )}
          </div>
          {isPreOrder && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowBookingForm(true);
              }}
              className="mt-3 w-full bg-blue-0 text-black py-2 px-4 rounded hover:bg-white transition-colors"
            >
              Book Now
            </button>
          )}
        </div>
      </Link>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-medium mb-4">Sold Out Item Booking</h3>
            <form onSubmit={handleBookNow} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={bookingInfo.name}
                  onChange={(e) => setBookingInfo({...bookingInfo, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={bookingInfo.email}
                  onChange={(e) => setBookingInfo({...bookingInfo, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  required
                  value={bookingInfo.phone}
                  onChange={(e) => setBookingInfo({...bookingInfo, phone: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <div className="space-y-2">
                  {product.sizes.map(size => (
                    <div key={size.size} className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSize(size.size);
                          setBookingInfo({...bookingInfo, size: size.size});
                        }}
                        className={`flex-1 py-2 px-4 text-left border rounded-md transition-colors ${
                          bookingInfo.size === size.size
                            ? 'border-black bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="block text-sm font-medium">{size.size}</span>
                        <span className={`block text-sm ${
                          size.isPreOrder ? 'text-blue-600' : 
                          size.stock === 0 ? 'text-red-500' : 
                          'text-green-600'
                        }`}>
                          {getStockInfoText(size)}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-4 bg-black text-white rounded-md hover:bg-white hover:text-black ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Thank You for Your Booking!</h2>
            <p className="text-gray-600 mb-6">
              We've received your booking for {product.name}. We'll contact you as soon as the item becomes available.
            </p>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 mb-4">
                A confirmation email has been sent to your email address.
              </p>
              <button
                onClick={() => setShowThankYou(false)}
                className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Products = () => {
  const tops = products.filter(product => product.id === 3 || product.id === 4);
  const pants = products.filter(product => product.id === 5 || product.id === 6);

  return (
    <section className="w-full bg-white py-16 px-4 md:px-8">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Best Sellers</h2>
        <p className="text-gray-500 text-sm md:text-base">Featured products & New collections</p>
      </div>

      {/* Original Desktop/Tablet Grid - Hidden on Mobile */}
      <div className="max-w-7xl mx-auto hidden md:block">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Mobile Only Layout */}
      <div className="md:hidden max-w-7xl mx-auto">
        {/* Sets */}
        <div className="grid grid-cols-1 gap-6">
          {products.slice(0, 2).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Tops Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-light mb-6">SAGE TOPS</h3>
          <div className="relative w-full overflow-x-auto hide-scrollbar">
            <div className="flex space-x-4">
              {tops.map((product) => (
                <div key={product.id} className="flex-none w-[85vw]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pants Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-light mb-6">SAGE PANTS</h3>
          <div className="relative w-full overflow-x-auto hide-scrollbar">
            <div className="flex space-x-4">
              {pants.map((product) => (
                <div key={product.id} className="flex-none w-[85vw]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

export default Products

'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import axios from 'axios'
import Nav from '@/app/sections/nav'
import { useCart } from '@/app/context/CartContext'
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  discount?: number;
}

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder: boolean;
}

interface Product {
  _id: string;
  name: string;
  title?: string;
  price: number;
  images: string[];
  selectedImages?: string[];
  description: string;
  Material: string[];
  sizes: SizeStock[];
  discount?: number;
  categories?: string[];
}

type ProductsType = {
  [key: string]: Product;
}

// This will be replaced with API data later
const localProducts: ProductsType = {
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
    ]
  },
  2: {
    _id: "2",
    name: '02 Sage set in light beige',
    price: 1300,
    images: [
      '/images/malak-image.jpg',
      '/images/malakfour-image.jpg',
      '/images/malakthree-image.jpg',
      '/images/malakfive-image.jpg'
    ],
    description: 'Experience the perfect blend of luxury and ease with this Rich Brown French linen set. Naturally breathable, and effortlessly elegant, it brings warmth and refinement to any setting.',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 7, isPreOrder: false },
      { size: 'M', stock: 20, isPreOrder: false }
    ]
  },
  3: {
    _id: "3",
    name: 'Sage top in Rich brown',
    price: 700,
    images: [
      '/images/modeleight-image.jpg',
      '/images/modelseven-image.jpg',
      '/images/modelsix-image.jpg'
    ],
    description: 'Effortlessly chic and breathable, this Rich Brown French linen top offers a perfect balance of comfort and elegance. Its timeless design and natural texture make it a versatile wardrobe essential',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 9, isPreOrder: false },
      { size: 'M', stock: 13, isPreOrder: false }
    ]
  },
  4: {
    _id: "4",
    name: 'Sage top in light beige',
    price: 700,
    images: [
      '/images/malakfive-image.jpg',
      '/images/malakfour-image.jpg',
      '/images/malaktwo-image.jpg',
      '/images/malakthree-image.jpg'
    ],
    description: 'Effortlessly chic and breathable, this Rich Brown French linen top offers a perfect balance of comfort and elegance. Its timeless design and natural texture make it a versatile wardrobe essential',
    Material: ['French linen'],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ]
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
    ]
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
    ]
  }
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

type Props = {
  params: {
    id: string
  }
}

const ProductPage = ({ params }: Props) => {
  const router = useRouter()
  const { id } = params
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [showAddedAnimation, setShowAddedAnimation] = useState(false)
  const pathname = usePathname()
  const { addToCart } = useCart()
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        
        // Transform the data to match our Product interface
        const transformedProduct: Product = {
          _id: data._id,
          name: data.title || 'Untitled Product',
          price: data.price || 0,
          images: data.selectedImages?.map((img: string) => 
            img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`
          ) || [],
          description: data.description || '',
          Material: ['French linen'], // Default material
          sizes: data.sizes.map((sizeStock: any) => ({
            size: sizeStock.size,
            stock: sizeStock.stock,
            isPreOrder: sizeStock.isPreOrder
          })),
          discount: data.discount || 0,
          categories: data.categories || []
        };
        
        console.log('Transformed product:', transformedProduct); // Debug log
        setProduct(transformedProduct);
      } catch (err) {
        console.error('Error fetching product:', err);
        // Try to find the product in local products
        const localProduct = Object.values(localProducts).find(p => p._id === id);
        if (localProduct) {
          setProduct(localProduct);
        } else {
          setError('Product not found');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Get 4 other products for the NEWEST section
  const getNewestProducts = () => {
    return Object.values(localProducts).slice(0, 4);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      alert('Please select a size')
      return
    }

    const cartItem: CartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      size: selectedSize,
      image: product.images[0],
      discount: product.discount
    };

    addToCart(cartItem);

    // Show animation
    setShowAddedAnimation(true)
    setTimeout(() => {
      setShowAddedAnimation(false)
    }, 2000)
  }

  const handleBuyNow = async () => {
    if (!product) return;
    if (!selectedSize) {
      alert('Please select a size')
      return
    }

    // Show the order form
    setShowOrderForm(true);
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);
    setOrderError('');

    const orderData = {
      customer: customerInfo,
      products: [{
        productId: product._id,
        name: product.name,
        quantity: quantity,
        price: product.discount 
          ? (product.price * (1 - product.discount/100))
          : product.price,
        size: selectedSize,
        image: product.images[0]
      }],
      totalAmount: quantity * (product.discount 
        ? (product.price * (1 - product.discount/100))
        : product.price),
      paymentMethod: "Cash on Delivery",
      shippingMethod: "Standard Delivery",
      status: "pending",
      orderDate: new Date().toISOString(),
      notes: ""
    };

    try {
      const response = await axios.post('/api/orders', orderData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201 || response.status === 200) {
        handleAddToCart();
        setShowOrderForm(false);
        setShowAddedAnimation(true);
        setTimeout(() => {
          setShowAddedAnimation(false);
          router.push('/cart');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setOrderError('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Product Not Found</h1>
            <Link href="/collection" className="text-black underline">
              Return to Collection
            </Link>
          </div>
        </div>
      </>
    );
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'SAGE COLLECTION', href: '/collection' },
    { label: product.name, href: pathname }
  ]

  return (
    <>
      <Nav />
      {/* Added to Cart Animation */}
      <div
        className={`fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-lg transform transition-all duration-300 z-50 ${
          showAddedAnimation
            ? 'translate-y-0 opacity-100'
            : 'translate-y-[-100%] opacity-0'
        }`}
      >
        Added to cart!
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-light mb-6">Complete Your Order</h2>
            {orderError && (
              <div className="mb-4 p-3 bg-red-50 text-red-500 rounded">
                {orderError}
              </div>
            )}
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full border p-2 rounded"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border p-2 rounded"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  className="w-full border p-2 rounded"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Address</label>
                <textarea
                  required
                  className="w-full border p-2 rounded"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1 px-4 py-2 border border-black hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-900 disabled:bg-gray-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-white pt-20">
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <span>/</span>}
              <Link href={crumb.href} className="hover:text-gray-800">
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Product Info */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left - Images */}
            <div className="w-full lg:w-2/3">
              {/* Mobile Image Scroll */}
              <div className="block lg:hidden">
                <div className="relative w-full overflow-x-auto hide-scrollbar">
                  <div className="flex space-x-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="flex-none w-[85vw] relative aspect-[4/5]">
                        {/* SOLD OUT Badge */}
                        {product.sizes.every(size => size.isPreOrder) && index === 0 && (
                          <div className="absolute top-3 right-3 z-20 bg-black text-white px-4 py-2 text-sm font-semibold rounded">
                            SOLD OUT
                          </div>
                        )}
                        <Image
                          src={image}
                          alt={`${product.name} - View ${index + 1}`}
                          fill
                          className="object-cover"
                          priority={index === 0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Image Stack */}
              <div className="hidden lg:flex flex-col space-y-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative aspect-[4/5] w-full">
                    {/* SOLD OUT Badge */}
                    {product.sizes.every(size => size.isPreOrder) && index === 0 && (
                      <div className="absolute top-3 right-3 z-20 bg-black text-white px-4 py-2 text-sm font-semibold rounded">
                        SOLD OUT
                      </div>
                    )}
                    <Image
                      src={image}
                      alt={`${product.name} - View ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Product Material */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-24 space-y-8">
               

                {/* Product Title & Price */}
                <div className="space-y-4">
                  <h1 className="text-4xl font-light">{product.name}</h1>
                  <p className="text-2xl">L.E {product.price}</p>
                </div>

                {/* Size Selection */}
                <div className="space-y-4">
                  <p className="text-lg">CHOOSE VARIANTS</p>
                  <p className="text-sm text-gray-500">Select Size</p>
                  <div className="flex gap-4">
                    {product.sizes.map((sizeOption) => (
                      <button
                        key={sizeOption.size}
                        onClick={() => setSelectedSize(sizeOption.size)}
                        className={`flex-1 flex items-center justify-center h-12 relative transition-all ${
                          selectedSize === sizeOption.size
                            ? 'text-white'
                            : 'text-black hover:text-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full border border-current flex items-center justify-center transition-colors ${
                          selectedSize === sizeOption.size
                            ? 'bg-black border-black'
                            : 'hover:bg-black hover:border-black'
                        }`}>
                          {sizeOption.size}
                        </div>
                        <span className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs ${
                          sizeOption.isPreOrder ? 'text-red-500' :
                          sizeOption.stock === 0 ? 'text-red-500' :
                          'text-green-600'
                        }`}>
                          {sizeOption.isPreOrder ? 'Sold out' :
                           sizeOption.stock === 0 ? 'Out of stock' :
                           ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity & Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border border-gray-300 p-2 w-32">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 transition-colors"
                      disabled={product.sizes.every(size => size.isPreOrder)}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 transition-colors"
                      disabled={product.sizes.every(size => size.isPreOrder)}
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={handleAddToCart}
                    disabled={!selectedSize || product.sizes.every(size => size.isPreOrder)}
                    className={`w-full py-4 relative overflow-hidden group transition-colors ${
                      !selectedSize || product.sizes.every(size => size.isPreOrder)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-black'
                    }`}
                  >
                    <span className="relative z-10">
                      {product.sizes.every(size => size.isPreOrder) ? 'SOLD OUT' : 'ADD TO CART'}
                    </span>
                    {!product.sizes.every(size => size.isPreOrder) && (
                      <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    )}
                  </button>
                </div>

                {/* Product Description */}
                <div className="space-y-4 pt-8 border-t">
                  <div className="space-y-1">
                    {[
                      {
                        title: "DESCRIPTION",
                        content: product.description
                      },
                      {
                        title: "SHIPPING & RETURNS",
                        content: (
                          <ul className="list-disc pl-4 space-y-3 text-sm text-gray-600">
                            <li>Shipping in 3-7 days</li>
                            <li><strong>On-the-Spot Trying:</strong> Customers have the ability to try on the item while the courier is present at the time of delivery.</li>
                            <li><strong>Immediate Return Requirement:</strong> If the customer is not satisfied, they must return the item immediately to the courier. Once the courier leaves, the item is considered accepted, and no returns or refunds will be processed.</li>
                            <li><strong>Condition of Return:</strong> The item must be undamaged, and in its original packaging for a successful return.</li>
                            <li><strong>No Returns After Courier Departure:</strong> After the courier has left, all sales are final, and no returns, exchanges, or refunds will be accepted.</li>
                          </ul>
                        )
                      },
                      {
                        title: "Material",
                        content: (
                          <ul className="list-disc pl-4 space-y-2">
                            {product.Material.map((detail, index) => (
                              <li key={index}>{detail}</li>
                            ))}
                          </ul>
                        )
                      },
                      {
                        title: "SIZE GUIDE",
                        content: (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Small fits from 50 to 58 kgs</p>
                            <p className="text-sm text-gray-600">Medium from 59 to 70 kgs</p>
                          </div>
                        )
                      }
                    ].map((section, index) => (
                      <div
                        key={section.title}
                        className="border-b border-stone-200 last:border-b-0 relative isolate group/faq"
                        onClick={() => {
                          if (index === selectedSection) {
                            setSelectedSection(null);
                          } else {
                            setSelectedSection(index);
                          }
                        }}
                      >
                        <div className={twMerge(
                          "absolute h-0 w-full bottom-0 left-0 bg-stone-50 -z-10 group-hover/faq:h-full transition-all duration-700",
                          index === selectedSection && "h-full"
                        )}></div>
                        <div className={twMerge(
                          "flex items-center justify-between gap-4 py-4 cursor-pointer transition-all duration-500 group-hover/faq:px-4",
                          index === selectedSection && "px-4"
                        )}>
                          <div className="text-base font-medium">{section.title}</div>
                          <div className={twMerge(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full transition duration-300",
                            index === selectedSection ? "rotate-45" : ""
                          )}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                              />
                            </svg>
                          </div>
                        </div>
                        <AnimatePresence>
                          {index === selectedSection && (
                            <motion.div
                              className="overflow-hidden px-4"
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                            >
                              <div className="pb-4 text-sm text-gray-600">
                                {section.content}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Share */}
                <div className="pt-8 border-t">
                  <p className="mb-4">Share</p>
                  <div className="flex gap-4">
                    <Link href="mailto:kenzyzayed04@gmail.com" className="text-gray-600 hover:text-black">
                      Gmail
                    </Link>
                    <Link href="https://www.instagram.com/kleankuts_?igsh=MWJiaG40ZDVubDVhNA==" className="text-gray-600 hover:text-black">
                     Instagram
                    </Link>
                    <Link href="https://www.tiktok.com/@kleankuts?_t=ZS-8viW6yr2prk&_r=1" className="text-gray-600 hover:text-black">
                     Tiktok
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEWEST Section */}
        <section className="max-w-7xl mx-auto px-4 py-16 mt-16 border-t">
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-12">NEWEST</h2>
          
          {/* Mobile Horizontal Scroll */}
          <div className="block lg:hidden">
            <div className="relative w-full overflow-x-auto hide-scrollbar">
              <div className="flex space-x-4">
                {getNewestProducts().map((newestProduct) => (
                  <Link 
                    href={`/product/${newestProduct._id}`} 
                    key={newestProduct._id}
                    className="flex-none w-[70vw] group"
                  >
                    <div className="relative aspect-[3/4] mb-4">
                      <Image
                        src={newestProduct.images[0]}
                        alt={newestProduct.name}
                        fill
                        className="object-cover object-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-light group-hover:underline">{newestProduct.name}</h3>
                      <div className="flex items-center gap-3">
                        <p>L.E {newestProduct.price}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:grid grid-cols-4 gap-6">
            {getNewestProducts().map((newestProduct) => (
              <Link 
                href={`/product/${newestProduct._id}`} 
                key={newestProduct._id}
                className="group"
              >
                <div className="relative aspect-[3/4] mb-4">
                  <Image
                    src={newestProduct.images[0]}
                    alt={newestProduct.name}
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-light group-hover:underline">{newestProduct.name}</h3>
                  <div className="flex items-center gap-3">
                    <p>L.E {newestProduct.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

export default ProductPage
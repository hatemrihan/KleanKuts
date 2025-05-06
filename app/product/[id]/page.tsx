'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Nav from '@/app/sections/nav'
import Footer from '@/app/sections/footer'
import { useCart } from '@/app/context/CartContext'
import { AnimatePresence, motion } from "framer-motion"
import { twMerge } from "tailwind-merge"
import { optimizeCloudinaryUrl, processImageUrl } from '@/app/utils/imageUtils';
import axios from 'axios'

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image: string;
  discount?: number;
  _stockInfo?: {
    originalStock: number;
    size: string;
    color: string;
  };
}

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder: boolean;
}

interface ColorVariant {
  color: string;
  hexCode?: string;
  stock: number;
}

interface SizeVariant {
  size: string;
  colorVariants: ColorVariant[];
}

interface Product {
  _id: string;
  name: string;
  title?: string;
  price: number;
  images: string[];
  description: string;
  Material: string[];
  sizes: SizeStock[];
  sizeVariants?: SizeVariant[];
  discount?: number;
  categories?: string[];
}

type Props = {
  params: {
    id: string
  }
}

const ProductPage = ({ params }: Props) => {
  const { id } = params
  const router = useRouter()
  const pathname = usePathname()
  const { addToCart } = useCart()
  
  // State
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [availableColors, setAvailableColors] = useState<ColorVariant[]>([])
  const [showAddedAnimation, setShowAddedAnimation] = useState(false)
  const [selectedSection, setSelectedSection] = useState<number | null>(null)

  // Effect to update available colors when size changes
  useEffect(() => {
    if (product && product.sizeVariants && selectedSize) {
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize)
      if (sizeVariant) {
        setAvailableColors(sizeVariant.colorVariants)
        // Auto-select first color if available
        if (sizeVariant.colorVariants.length > 0 && !selectedColor) {
          setSelectedColor(sizeVariant.colorVariants[0].color)
        }
      } else {
        setAvailableColors([])
      }
    } else {
      setAvailableColors([])
    }
  }, [product, selectedSize, selectedColor])

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        console.log('Fetching product with ID:', id)
        
        // Try to fetch from our API first
        try {
          // Add cache busting parameter to avoid stale data
          const response = await fetch(`/api/products/${id}?t=${Date.now()}`, {
            cache: 'no-store'
          })
          
          if (!response.ok) {
            throw new Error(`API returned status ${response.status}`)
          }

          const data = await response.json()
          console.log('Received product data:', data)
          
          // Process product data
          processProductData(data)
          console.log('Successfully processed product data')
          return
        } catch (apiError) {
          console.error('Error fetching from API:', apiError)
          // Continue to fallback
        }

        // If we're here, the API fetch failed, try local data
        console.log('Falling back to local data')
        
        // Create a placeholder product
        const placeholderProduct: Product = {
          _id: id,
          name: 'Product ' + id,
          price: 0,
          images: ['/images/model-image.jpg'],
          description: 'Product description not available.',
          Material: ['Unknown'],
          sizes: [{ size: 'One Size', stock: 10, isPreOrder: false }]
        }
        
        setProduct(placeholderProduct)
        setSelectedSize(placeholderProduct.sizes[0].size)
        
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    // Helper function to process product data
    const processProductData = (data: any) => {
      try {
        console.log('Processing product data:', data);
        
        // Process images safely
        const productImages = []
        try {
          if (Array.isArray(data.selectedImages) && data.selectedImages.length > 0) {
            productImages.push(...data.selectedImages.map((img: string) => processImageUrl(img)))
          } else if (Array.isArray(data.images) && data.images.length > 0) {
            productImages.push(...data.images.map((img: string) => processImageUrl(img)))
          } else if (typeof data.image === 'string') {
            productImages.push(processImageUrl(data.image))
          }
        } catch (imgErr) {
          console.error('Error processing images:', imgErr)
        }
        
        // If no images were found, add a default image
        if (productImages.length === 0) {
          productImages.push('/images/model-image.jpg')
        }
        
        // Process sizes and size variants
        let productSizes = []
        let productSizeVariants = undefined
        
        try {
          // Check if we have sizeVariants in the data (admin panel format)
          if (data.sizeVariants && Array.isArray(data.sizeVariants) && data.sizeVariants.length > 0) {
            console.log('Found size variants in data:', data.sizeVariants);
            productSizeVariants = data.sizeVariants;
            
            // Also create simple sizes array for compatibility
            productSizes = data.sizeVariants.map((sv: any) => {
              // Calculate total stock across all colors for this size
              const totalStock = Array.isArray(sv.colorVariants) 
                ? sv.colorVariants.reduce((sum: number, cv: any) => sum + (cv.stock || 0), 0)
                : 0;
                
              return {
                size: sv.size,
                stock: totalStock,
                isPreOrder: totalStock <= 0 // Mark as pre-order if no stock
              };
            });
          }
          // If no size variants but we have selectedSizes
          else if (Array.isArray(data.selectedSizes) && data.selectedSizes.length > 0) {
            productSizes = data.selectedSizes.map((size: string) => ({
              size,
              stock: 10, // Default stock value
              isPreOrder: false
            }));
          } 
          // If we have a sizes array
          else if (Array.isArray(data.sizes) && data.sizes.length > 0) {
            productSizes = data.sizes.map((sizeStock: any) => ({
              size: sizeStock.size || 'One Size',
              stock: typeof sizeStock.stock === 'number' ? sizeStock.stock : 10,
              isPreOrder: Boolean(sizeStock.isPreOrder)
            }));
          } 
          // Default fallback
          else {
            productSizes = [{ size: 'One Size', stock: 10, isPreOrder: false }];
          }
        } catch (sizeErr) {
          console.error('Error processing sizes:', sizeErr);
          productSizes = [{ size: 'One Size', stock: 10, isPreOrder: false }];
        }

        // Create the transformed product
        const transformedProduct: Product = {
          _id: data._id || data.id || id, // Support both _id and id fields, fallback to URL id
          name: data.title || data.name || 'Untitled Product',
          price: typeof data.price === 'number' ? data.price : 0,
          images: productImages,
          description: data.description || '',
          Material: Array.isArray(data.material) ? data.material : ['French linen'],
          sizes: productSizes,
          sizeVariants: productSizeVariants,
          discount: typeof data.discount === 'number' ? data.discount : 0,
          categories: Array.isArray(data.categories) ? data.categories : []
        }

        console.log('Transformed product:', transformedProduct)
        setProduct(transformedProduct)
        
        // If there's only one size, select it automatically
        if (productSizes.length > 0) {
          setSelectedSize(productSizes[0].size)
        }
      } catch (processError) {
        console.error('Error processing product data:', processError)
        throw new Error('Failed to process product data')
      }
    }

    fetchProduct()
  }, [id])

  // Handle adding to cart
  const handleAddToCart = () => {
    if (!product) return
    
    if (!selectedSize) {
      alert('Please select a size')
      return
    }

    // If product has sizeVariants and colors are available, require color selection
    if (product.sizeVariants && availableColors.length > 0 && !selectedColor) {
      alert('Please select a color')
      return
    }
    
    // Get the selected color variant to include stock information
    let selectedColorStock = 0
    let selectedColorData = null
    
    if (product.sizeVariants && selectedSize && selectedColor) {
      // Find the selected size variant
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize)
      if (sizeVariant) {
        // Find the selected color within this size
        const colorVariant = sizeVariant.colorVariants.find(cv => cv.color === selectedColor)
        if (colorVariant) {
          selectedColorStock = colorVariant.stock
          selectedColorData = colorVariant
          console.log(`Adding to cart: ${selectedSize} in ${selectedColor}, stock: ${selectedColorStock}`)
        }
      }
    }
    
    // Check if we have enough stock
    if (selectedColorData && selectedColorStock < quantity) {
      alert(`Sorry, we only have ${selectedColorStock} items in stock for ${selectedSize} in ${selectedColor}.`)
      return
    }

    const cartItem: CartItem = {
      id: product._id,
      name: product.name || product.title || '',
      price: product.price,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor || undefined,
      image: product.images[0] || '/images/model-image.jpg',
      discount: product.discount,
      // Include stock information to help with inventory management
      _stockInfo: selectedColorData ? {
        originalStock: selectedColorStock,
        size: selectedSize,
        color: selectedColor
      } : undefined
    }

    addToCart(cartItem)

    // Show animation
    setShowAddedAnimation(true)
    setTimeout(() => {
      setShowAddedAnimation(false)
    }, 2000)
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
        <Footer />
      </>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-xl">
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/collection" className="text-black underline">
              Return to Collection
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Collection', href: '/collection' },
    { label: product.name, href: pathname }
  ]

  // Check if product is sold out
  const isSoldOut = product.sizes.every(size => 
    (typeof size.stock === 'number' && size.stock <= 0) || 
    size.isPreOrder === true
  )

  // Calculate price with discount
  const finalPrice = product.discount 
    ? product.price - (product.price * product.discount / 100) 
    : product.price

  return (
    <>
      <Nav />
      
      {/* Added to Cart Animation */}
      <AnimatePresence>
        {showAddedAnimation && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-lg z-50"
          >
            Added to cart!
          </motion.div>
        )}
      </AnimatePresence>

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
                        {isSoldOut && index === 0 && (
                          <div className="absolute top-3 right-3 z-20 bg-black text-white px-4 py-2 text-sm font-semibold rounded">
                            SOLD OUT
                          </div>
                        )}
                        <Image
                          src={optimizeCloudinaryUrl(image, { width: 600 })}
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
                    {isSoldOut && index === 0 && (
                      <div className="absolute top-3 right-3 z-20 bg-black text-white px-4 py-2 text-sm font-semibold rounded">
                        SOLD OUT
                      </div>
                    )}
                    <Image
                      src={optimizeCloudinaryUrl(image, { width: 1200 })}
                      alt={`${product.name} - View ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Product Details */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-24 space-y-8">
                {/* Product Title & Price */}
                <div className="space-y-4">
                  <h1 className="text-4xl font-light">{product.name}</h1>
                  <div className="flex items-center gap-2">
                    {product.discount ? (
                      <>
                        <p className="text-xl">L.E {finalPrice.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 line-through">L.E {product.price.toFixed(2)}</p>
                      </>
                    ) : (
                      <p className="text-xl">L.E {product.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <h2 className="text-sm font-medium mb-2">Size</h2>
                  <div className="flex flex-wrap gap-2">
                    {/* Use sizeVariants if available, otherwise fall back to sizes */}
                    {product.sizeVariants ? (
                      product.sizeVariants.map((sizeVariant) => (
                        <button
                          key={sizeVariant.size}
                          onClick={() => setSelectedSize(sizeVariant.size)}
                          className={`flex-1 flex items-center justify-center h-12 relative transition-all ${
                            selectedSize === sizeVariant.size
                              ? 'text-white'
                              : 'text-black hover:text-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full border border-current flex items-center justify-center transition-colors ${
                            selectedSize === sizeVariant.size
                              ? 'bg-black border-black'
                              : 'hover:bg-black hover:border-black'
                          }`}>
                            {sizeVariant.size}
                          </div>
                          <span className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs ${
                            sizeVariant.colorVariants.every(cv => cv.stock === 0) ? 'text-red-500' : 'text-green-600'
                          }`}>
                            {sizeVariant.colorVariants.every(cv => cv.stock === 0) ? 'Out of stock' : ''}
                          </span>
                        </button>
                      ))
                    ) : (
                      product.sizes.map((sizeOption) => (
                        <button
                          key={sizeOption.size}
                          onClick={() => setSelectedSize(sizeOption.size)}
                          className={`px-4 py-2 border ${
                            selectedSize === sizeOption.size
                              ? 'border-black bg-black text-white'
                              : 'border-gray-300 hover:border-gray-500'
                          } ${
                            sizeOption.stock <= 0 && !sizeOption.isPreOrder
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          disabled={sizeOption.stock <= 0 && !sizeOption.isPreOrder}
                        >
                          {sizeOption.size}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Color Selection - Only show if sizeVariants exist and a size is selected */}
                {product.sizeVariants && selectedSize && availableColors.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-sm font-medium mb-2">Color</h2>
                    <div className="flex flex-wrap gap-4">
                      {availableColors.map((colorVariant) => (
                        <button
                          key={colorVariant.color}
                          onClick={() => setSelectedColor(colorVariant.color)}
                          disabled={colorVariant.stock === 0}
                          className={`relative px-4 py-2 border flex items-center gap-2 ${
                            colorVariant.stock === 0 ? 'border-gray-300 text-gray-300 cursor-not-allowed' : 
                            selectedColor === colorVariant.color ? 'border-black bg-black text-white' : 'border-gray-400 hover:border-black'}`}
                        >
                          {colorVariant.hexCode && (
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: colorVariant.hexCode }}
                            />
                          )}
                          {colorVariant.color}
                          {colorVariant.stock > 0 && colorVariant.stock <= 5 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                              {colorVariant.stock}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <h2 className="text-sm font-medium mb-2">Quantity</h2>
                  <div className="flex items-center border border-gray-300 w-32">
                    <button
                      className="px-3 py-1 border-r border-gray-300"
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="flex-1 text-center py-1">{quantity}</span>
                    <button
                      className="px-3 py-1 border-l border-gray-300"
                      onClick={() => quantity < 10 && setQuantity(quantity + 1)}
                      disabled={quantity >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isSoldOut || !selectedSize}
                  className={`w-full py-3 px-4 ${
                    isSoldOut || !selectedSize
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </button>

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
                        title: "MATERIAL",
                        content: (
                          <ul className="list-disc pl-4 space-y-2">
                            <li>French linen</li>
                          </ul>
                        )
                      },
                      {
                        title: "SIZE GUIDE",
                        content: (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">XS fits from 45 to 50 kgs</p>
                            <p className="text-sm text-gray-600">Small fits from 50 to 58 kgs</p>
                            <p className="text-sm text-gray-600">Medium from 59 to 70 kgs</p>
                            <p className="text-sm text-gray-600">Large from 71 to 80 kgs</p>
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
      </main>
      
      <Footer />
    </>
  )
}

export default ProductPage
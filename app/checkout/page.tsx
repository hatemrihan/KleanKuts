'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart, CART_STORAGE_KEY } from '../context/CartContext'
import Nav from '../sections/nav'
import { validateStock, reduceStock } from '../utils/stockUtils'
import { removeBlacklistedProducts, BLACKLISTED_PRODUCT_IDS } from '../utils/productBlacklist'
import { redirectToThankYou, prepareOrderItemsForStockReduction, completeOrderAndRedirect } from '../utils/orderRedirect'
import { toast } from 'react-hot-toast'
import { validateCoupon, reportSuccessfulOrder, calculateDiscountAmount } from '../utils/couponUtils'
import pixelTracking from '@/utils/pixelTracking'
import { updateInventory } from '../utils/inventoryUpdater'

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  apartment: string;
  city: string;
  notes: string;
  promoCode: string;
  paymentMethod: 'cashOnDelivery' | 'instaPay';
  transactionScreenshot: any; // Use any to avoid type issues with File
}

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

interface PromoDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  code: string;
  referralCode: string | null;
  ambassadorId?: string;
  isAmbassador: boolean;
  originalResponse?: any; // Store the full response from the API for reporting later
}

const shippingCosts = {
  'Cairo': 66,
  'Giza': 66,
  'Alexandria': 72,
  'Qailyoubiya': 83,
  'Buhirah': 83,
  'Gharbia': 83,
  'Munofiya': 83,
  'Damietta': 83,
  'Qalub': 83,
  'Dakahliya': 83,
  'Kafr-Elshiekh': 83,
  'Sharkia': 83,
  'Al-Ismailiyyah': 83,
  'Port-Said': 83,
  'Suez': 83,
  'Fayoum': 83,
  'Bani-Suwayf': 132,
  'Minya': 132,
  'Asyout': 132,
  'Souhag': 132,
  'Qena': 132,
  'Aswan': 132,
  'Luxor': 132,
  'Marsa Matrouh': 133,
} as const;

type City = keyof typeof shippingCosts;

const CheckoutPage = () => {
  const router = useRouter()
  const { cart, clearCart, cartTotal, setCart } = useCart()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    apartment: '',
    city: '',
    notes: '',
    promoCode: '',
    paymentMethod: 'cashOnDelivery',
    transactionScreenshot: null
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState<PromoDiscount | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [screenShotPreview, setScreenShotPreview] = useState<string | null>(null)

  const shippingCost = formData.city ? shippingCosts[formData.city as City] || 0 : 0
  
  // Calculate discount amount using the utility function
  const discountAmount = promoDiscount ? 
    (promoDiscount.type === 'fixed' ? 
      promoDiscount.value : 
      calculateDiscountAmount(promoDiscount.value, cartTotal)) : 
    0;
  const totalWithShipping = cartTotal + shippingCost - discountAmount

  // We're using the static blacklist instead of loading from database
  // This ensures compatibility with Netlify deployment
  const [blacklistLoaded, setBlacklistLoaded] = useState(true);
  
  // We're no longer filtering out products from the cart
  // This allows all products to proceed to checkout, even if they can't be found in the database
  useEffect(() => {
    if (!blacklistLoaded) return;
    
    console.log('Checkout page - allowing all products to proceed');
    console.log('Current cart items:', cart.map(item => item.id));
    
    // Log any products that might cause issues but don't remove them
    const potentialIssueItems = cart.filter(item => BLACKLISTED_PRODUCT_IDS.includes(item.id));
    
    if (potentialIssueItems.length > 0) {
      console.log(`Found ${potentialIssueItems.length} products that might cause issues:`);
      potentialIssueItems.forEach(item => {
        console.log(`- Product ID: ${item.id} (will still be allowed to proceed)`);
      });
    }
  }, [cart, setCart, blacklistLoaded]);
  
  // Redirect to cart if empty
  useEffect(() => {  
    if (cart.length === 0) {
      router.push('/cart')
    } else {
      // Track InitiateCheckout event when the checkout page loads
      const productIds = cart.map(item => item.id);
      const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
      
      pixelTracking.trackInitiateCheckout(
        productIds,
        cartTotal,
        totalItems
      );
    }
  }, [cart, router, cartTotal])

  if (typeof window === 'undefined' || cart.length === 0) {
    return null
  }

  const validateForm = () => {
    const newErrors: Partial<FormData> = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city) newErrors.city = 'Please select a city'
    if (formData.paymentMethod === 'instaPay' && !formData.transactionScreenshot) {
      newErrors.transactionScreenshot = 'Transaction screenshot is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset any previous error
    setOrderError(null)
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // First, validate that all items are in stock
      try {
        console.log('Validating stock levels...');
        const stockValidation = await validateStock(cart.map(item => ({
          productId: item.id,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          _stockInfo: item._stockInfo
        })));
        
        console.log('Stock validation result:', stockValidation);
        
        if (!stockValidation.valid) {
          setOrderError(stockValidation.message || 'Some items in your cart are no longer available in the requested quantity.');
          setIsSubmitting(false);
          return;
        }
      } catch (stockError: any) {
        console.error('Stock validation error:', stockError);
        setOrderError('Unable to verify stock availability. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Handle screenshot upload if InstaPay is selected
      let screenshotUrl = null;
      if (formData.paymentMethod === 'instaPay' && formData.transactionScreenshot) {
        try {
          console.log('Starting transaction screenshot upload...', {
            fileName: formData.transactionScreenshot.name,
            fileSize: formData.transactionScreenshot.size,
            fileType: formData.transactionScreenshot.type
          });
          
          const formDataForImage = new FormData();
          formDataForImage.append('file', formData.transactionScreenshot);
          // Try using Cloudinary's default upload preset
          const uploadPreset = 'kleankuts_upload';
          console.log('Using upload preset:', uploadPreset);
          formDataForImage.append('upload_preset', uploadPreset);
          formDataForImage.append('folder', 'transaction_screenshots');
          
          try {
            // Direct upload to Cloudinary
            const response = await fetch('https://api.cloudinary.com/v1_1/dvcs7czio/image/upload', {
              method: 'POST',
              body: formDataForImage
            });

            // First check if the response is ok
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Upload failed:', errorText);
              console.error('Upload settings:', {
                preset: uploadPreset,
                apiUrl: 'https://api.cloudinary.com/v1_1/dvcs7czio/image/upload',
                folder: 'transaction_screenshots'
              });
              throw new Error(`Upload failed with status: ${response.status}`);
            }

            // Parse the response as JSON
            let data;
            try {
              data = await response.json();
              console.log('Upload response:', data);
            } catch (parseError) {
              console.error('Failed to parse upload response:', parseError);
              throw new Error('Invalid response from upload service');
            }

            if (data.secure_url) {
              screenshotUrl = data.secure_url;
              console.log('Screenshot uploaded successfully:', screenshotUrl);
            } else {
              console.error('No secure_url in response:', data);
              throw new Error('Failed to upload screenshot: No secure URL returned');
            }
          } catch (uploadError) {
            console.error('Full upload error:', uploadError);
            throw uploadError;
          }
        } catch (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
          setOrderError(`Failed to upload transaction screenshot: ${(uploadError as Error).message || 'Please try again.'}`);
          setIsSubmitting(false);
          return;
        }
      }

      // First, send to our main API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            address: `${formData.address.trim()}${formData.apartment ? ', ' + formData.apartment.trim() : ''}${formData.city ? ', ' + formData.city : ''}`
          },
          products: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            image: item.image
          })),
          paymentMethod: formData.paymentMethod,
          transactionScreenshot: screenshotUrl,
          totalAmount: totalWithShipping,
          status: 'pending',
          notes: formData.notes || '',
          orderDate: new Date().toISOString(),
          promoCode: promoDiscount ? {
            code: promoDiscount.code,
            type: promoDiscount.type,
            value: promoDiscount.value,
            discountAmount: discountAmount,
            referralCode: promoDiscount.referralCode,
            isAmbassador: promoDiscount.isAmbassador,
            ambassadorId: promoDiscount.ambassadorId
          } : null
        }),
      })

      const data = await response.json()

      if (response.ok) {
        try {
          // Get the order ID for inventory updates
          const orderId = data.order?._id || data.orderId || data._id;
          
          // Store the order ID for thank-you page
          if (orderId) {
            console.log('Order ID for thank-you page:', orderId);
            sessionStorage.setItem('pendingOrderId', orderId);
            localStorage.setItem('lastOrderDetails', JSON.stringify({
              orderId: orderId,
              timestamp: Date.now()
            }));
          }
          
          // Update inventory immediately after successful order
          let inventoryUpdateSuccess = false;
          try {
            console.log('Updating inventory for order:', orderId);
            const inventoryResult = await updateInventory(orderId);
            inventoryUpdateSuccess = inventoryResult && inventoryResult.success;
            
            if (inventoryUpdateSuccess) {
              console.log('✅ Inventory update completed successfully');
            } else {
              console.warn('⚠️ Inventory update did not complete successfully, will retry on thank-you page');
              
              // Store the order ID for later processing
              sessionStorage.setItem('pendingOrderId', orderId);
            }
          } catch (inventoryError) {
            console.error('Error updating inventory:', inventoryError);
            // Store the order ID for later processing
            sessionStorage.setItem('pendingOrderId', orderId);
          }
          
          // Create order details object to reuse for both admin panel and ambassador reporting
          const orderDetails = {
            orderId: orderId || Date.now().toString(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            address: formData.address.trim(),
            apartment: formData.apartment.trim(),
            city: formData.city,
            notes: formData.notes || '',
            paymentMethod: formData.paymentMethod,
            transactionScreenshot: screenshotUrl,
            paymentVerified: false, // Add paymentVerified field for admin tracking
            products: cart.map(item => ({
              id: item.id,
              productId: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              image: item.image
            })),
            total: Number(totalWithShipping.toFixed(0)),
            subtotal: cartTotal,
            shippingCost: shippingCost,
            discountAmount: discountAmount,
            promoCode: promoDiscount ? {
              code: promoDiscount.code,
              type: promoDiscount.type,
              value: promoDiscount.value,
              discountAmount: discountAmount,
              referralCode: promoDiscount.referralCode,
              isAmbassador: promoDiscount.isAmbassador,
              ambassadorId: promoDiscount.ambassadorId
            } : null
          };
          
          // Then, send to admin panel API
          console.log('Sending order to admin panel...');
          const adminResponse = await fetch('https://eleveadmin.netlify.app/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': 'https://elevee.netlify.app'
            },
            body: JSON.stringify(orderDetails)
          });

          console.log('Admin panel response status:', adminResponse.status);
          const adminData = await adminResponse.json();
          console.log('Admin panel response:', adminData);

          if (adminResponse.ok) {
            console.log('✅ Order successfully sent to admin panel');
            
            // If there was a promo code used, report it to the ambassador system
            if (promoDiscount && promoDiscount.code) {
              try {
                console.log('Reporting order with promo code to ambassador system...');
                const reportResult = await reportSuccessfulOrder(orderDetails, promoDiscount.code);
                console.log('Ambassador system report result:', reportResult);
              } catch (ambassadorError) {
                console.error('Error reporting to ambassador system:', ambassadorError);
                // Don't block checkout flow if ambassador reporting fails
              }
            }
          } else {
            console.error('⚠️ Admin panel error:', adminData.error || 'Failed to sync with admin panel');
            // Main order was successful, so we still proceed, but log the issue
            console.warn('Continuing with checkout despite admin panel sync issue - order was saved in main database');
          }

          // Let the thank-you page handle stock reduction exclusively
          // IMPORTANT: We need to prepare the stock reduction data BEFORE clearing the cart
          console.log('Preparing cart items for stock reduction before clearing cart');
          completeOrderAndRedirect(cart, orderId);
          
          // Track successful purchase with Facebook Pixel
          const productIds = cart.map(item => item.id);
          const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
          
          pixelTracking.trackPurchase(
            totalWithShipping,
            productIds,
            totalItems
          );
          
          // Clear cart AFTER preparing the stock reduction data
          // This ensures the stock data is properly saved before clearing
          console.log('Now clearing cart after stock data is prepared');
          clearCart();
          
          // Ensure localStorage is cleared in case the clearCart function in CartContext fails
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(CART_STORAGE_KEY);
              console.log('Successfully cleared cart from localStorage directly');
            } catch (localStorageError) {
              console.error('Error clearing cart from localStorage:', localStorageError);
            }
          }
        } catch (adminError: any) {
          console.error('Admin panel error:', adminError);
          
          // Also in the fallback path
          // Let the thank-you page handle stock reduction exclusively
          // IMPORTANT: We need to prepare the stock reduction data BEFORE clearing the cart
          console.log('Preparing cart items for stock reduction before clearing cart (fallback path)');
          const fallbackOrderId = data.order?._id || data.orderId || data._id;
          completeOrderAndRedirect(cart, fallbackOrderId);
          
          // Clear cart AFTER preparing the stock reduction data
          // This ensures the stock data is properly saved before clearing
          console.log('Now clearing cart after stock data is prepared (fallback path)');
          clearCart();
          
          // Ensure localStorage is cleared in case the clearCart function in CartContext fails
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(CART_STORAGE_KEY);
              console.log('Successfully cleared cart from localStorage directly (fallback path)');
            } catch (localStorageError) {
              console.error('Error clearing cart from localStorage:', localStorageError);
            }
          }
        }
      } else {
        // Main API order failed
        const errorMessage = data.error || data.details?.join(', ') || 'Something went wrong with your order'
        setOrderError(errorMessage)
        
        // Store error in session storage and redirect to error page
        sessionStorage.setItem('orderError', JSON.stringify({
          message: errorMessage,
          timestamp: new Date().toISOString()
        }));
        
        console.log('Order failed, redirecting to error page');
        setTimeout(() => {
          router.push('/order-error');
        }, 100);
        
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Order submission error:', error)
      const errorMessage = error.message || 'An unexpected error occurred'
      setOrderError(errorMessage)
      
      // Store error in session storage and redirect to error page
      sessionStorage.setItem('orderError', JSON.stringify({
        message: errorMessage,
        timestamp: new Date().toISOString()
      }));
      
      console.log('Order failed with exception, redirecting to error page');
      setTimeout(() => {
        router.push('/order-error');
      }, 100);
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field if there is any
    if (errors[name as keyof FormData]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof FormData]
        return newErrors
      })
    }
    
    // Clear order error when user updates form
    if (orderError) {
      setOrderError(null)
    }
    
    // Clear promo code when it's changed
    if (name === 'promoCode') {
      setPromoDiscount(null);
      setPromoError(null);
    }
  }
  
  const validatePromoCode = async () => {
    // Don't validate if empty
    if (!formData.promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    
    setIsValidatingPromo(true);
    setPromoError(null);
    
    try {
      // Use the external API through our utility function
      const result = await validateCoupon(formData.promoCode.trim());
      console.log('Coupon validation result:', result);
      
      if (result.valid && result.discount) {
        // Store the complete discount info from the API
        setPromoDiscount({
          ...result.discount,
          originalResponse: result // Store the full response for reporting later
        });
        
        // Show success message with the correct discount format
        const discountText = result.discount.type === 'percentage' ? 
          `${result.discount.value}% off` : 
          `L.E ${result.discount.value} off`;
          
        toast.success(`Promo code applied: ${discountText}`);
      } else {
        setPromoError(result.message || 'Invalid promo code');
        setPromoDiscount(null);
        toast.error(result.message || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError('Failed to validate promo code');
      setPromoDiscount(null);
      toast.error('Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  }

  // Handle file upload for transaction screenshot
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          transactionScreenshot: 'File size must be less than 5MB'
        }));
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          transactionScreenshot: 'Only image files are allowed'
        }));
        return;
      }
      
      setFormData(prev => ({ ...prev, transactionScreenshot: file }));
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenShotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.transactionScreenshot;
        return newErrors;
      });
      
      console.log('File selected for upload:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB', 'Type:', file.type);
    }
  };

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-black dark:text-white transition-colors duration-300">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8">
            <span>←</span>
            <span>Back to cart</span>
          </Link>

          <h1 className="text-4xl md:text-5xl font-light mb-12">CHECKOUT</h1>

          {orderError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-300 text-red-700 rounded">
              <h3 className="font-medium mb-2 dark:text-white transition-colors duration-300">Order Submission Failed</h3>
              <p>{orderError}</p>
              <p className="mt-2 text-sm">Please check your information and try again, or contact support if the problem persists.</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Checkout Form */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-black dark:text-white">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full p-3 border ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full p-3 border ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="cashOnDelivery"
                        name="paymentMethod"
                        value="cashOnDelivery"
                        checked={formData.paymentMethod === 'cashOnDelivery'}
                        onChange={handleInputChange}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="cashOnDelivery" className="text-sm">Cash on Delivery</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="instaPay"
                        name="paymentMethod"
                        value="instaPay"
                        checked={formData.paymentMethod === 'instaPay'}
                        onChange={handleInputChange}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="instaPay" className="text-sm">Pay with InstaPay</label>
                    </div>
                  </div>
                </div>
                
                {/* InstaPay Instructions and Screenshot Upload */}
                {formData.paymentMethod === 'instaPay' && (
                  <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md">
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">InstaPay Payment Instructions</h3>
                      <p className="text-sm mb-2">Click the link to send money to:</p>
                      <p className="font-medium mb-2">seifmahmoud1235@instapay</p>
                      <p className="text-sm mb-2">Powered by InstaPay:</p>
                      <a 
                        href="https://ipn.eg/S/seifmahmoud1235/instapay/96HscL" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline text-sm"
                      >
                        https://ipn.eg/S/seifmahmoud1235/instapay/96HscL
                      </a>
                    </div>
                    
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Transaction Screenshot *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                      />
                      {errors.transactionScreenshot && (
                        <p className="text-red-500 text-sm mt-1">{errors.transactionScreenshot}</p>
                      )}
                    </div>
                    
                    {/* Preview of the screenshot */}
                    {screenShotPreview && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Preview:</p>
                        <div className="relative w-40 h-40 border border-gray-300">
                          <Image 
                            src={screenShotPreview} 
                            alt="Transaction screenshot" 
                            fill 
                            className="object-contain" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>Promo Code</span>
                    {promoDiscount && (
                      <span className="text-green-600 dark:text-green-400">Applied!</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleInputChange}
                      placeholder="Enter promo code"
                      className={`flex-grow p-3 border ${promoError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                      disabled={isValidatingPromo || !!promoDiscount}
                    />
                    <button 
                      type="button"
                      onClick={promoDiscount ? () => {
                        setPromoDiscount(null);
                        setFormData(prev => ({ ...prev, promoCode: '' }));
                      } : validatePromoCode}
                      className={`px-4 py-2 border ${promoDiscount ? 'bg-red-600 text-white border-red-600' : 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'} font-medium text-sm transition-colors duration-300`}
                      disabled={isValidatingPromo}
                    >
                      {isValidatingPromo ? 'Checking...' : (promoDiscount ? 'Remove' : 'Apply')}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-red-500 text-sm mt-1">{promoError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apartment
                  </label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${errors.apartment ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                  />
                  {errors.apartment && (
                    <p className="text-red-500 text-sm mt-1">{errors.apartment}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                  >
                    <option value="">Select a city</option>
                    {Object.entries(shippingCosts).map(([city]) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${errors.notes ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}
                  />
                  {errors.notes && (
                    <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full p-3 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none transition-colors duration-300"
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-1/3 bg-gray-100 dark:bg-gray-900 p-6 rounded-lg h-fit transition-colors duration-300">
              <h2 className="text-xl font-medium mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center gap-4">
                    <div className="w-16 h-16 relative bg-gray-200 dark:bg-gray-800 transition-colors duration-300">
                      {item.image && (
                        <Image 
                          src={item.image} 
                          alt={item.name} 
                          fill 
                          sizes="64px"
                          style={{ objectFit: 'cover' }} 
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                        {item.size}{item.color ? `, ${item.color}` : ''} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>L.E {(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 transition-colors duration-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>L.E {cartTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                </div>
                {promoDiscount && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>
                      Discount
                      {promoDiscount.type === 'percentage' && <span> ({promoDiscount.value}%)</span>}
                    </span>
                    <span className="font-medium">-L.E {discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg pt-2 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                  <span>Total</span>
                  <span>L.E {totalWithShipping.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CheckoutPage
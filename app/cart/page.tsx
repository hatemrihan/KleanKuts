'use client'

import React, { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import Nav from '../sections/nav'
import Link from 'next/link'
import Image from 'next/image'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'
import { cleanCart } from '../utils/cartUtils'
import { removeBlacklistedProducts, BLACKLISTED_PRODUCT_IDS, loadBlacklistFromDatabase } from '../utils/productBlacklist'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, checkoutCart, setCart } = useCart()
  const [checkoutInProgress, setCheckoutInProgress] = React.useState(false)
  const [checkoutError, setCheckoutError] = React.useState('')
  const [isCleaningCart, setIsCleaningCart] = React.useState(true)
  const [blacklistLoaded, setBlacklistLoaded] = React.useState(false)
  
  // Load the blacklist from the database when the page loads
  useEffect(() => {
    const loadBlacklist = async () => {
      try {
        console.log('Loading product blacklist from database...');
        const success = await loadBlacklistFromDatabase();
        if (success) {
          console.log('Blacklist loaded successfully with', BLACKLISTED_PRODUCT_IDS.length, 'items');
        } else {
          console.error('Failed to load blacklist from database');
        }
        setBlacklistLoaded(true);
      } catch (error) {
        console.error('Error loading blacklist:', error);
        setBlacklistLoaded(true); // Continue anyway with the in-memory blacklist
      }
    };
    
    loadBlacklist();
  }, []);
  
  // Clean the cart on page load to remove any invalid products
  useEffect(() => {
    // Don't clean the cart until the blacklist is loaded
    if (!blacklistLoaded) return;
    
    const cleanCartItems = async () => {
      try {
        setIsCleaningCart(true);
        console.log('Starting cart cleaning process...');
        console.log('Current blacklist:', BLACKLISTED_PRODUCT_IDS);
        console.log('Current cart items:', cart.map(item => item.id));
        
        // IMMEDIATE FIX: Remove blacklisted product IDs
        let cartNeedsUpdate = false;
        
        // First check for any blacklisted product IDs
        const blacklistedItems = cart.filter(item => {
          const isBlacklisted = BLACKLISTED_PRODUCT_IDS.includes(item.id);
          console.log(`Checking item ${item.id}: ${isBlacklisted ? 'BLACKLISTED' : 'OK'}`);
          return isBlacklisted;
        });
        
        if (blacklistedItems.length > 0) {
          console.log(`Found ${blacklistedItems.length} blacklisted products in cart:`);
          blacklistedItems.forEach(item => {
            console.log(`- Removing product ID: ${item.id}`);
          });
          cartNeedsUpdate = true;
        }
        
        // Filter out blacklisted products
        const filteredCart = removeBlacklistedProducts(cart);
        
        // If we removed the problematic product, update the cart immediately
        if (cartNeedsUpdate) {
          setCart(filteredCart);
          setCheckoutError('');
          setIsCleaningCart(false);
          return;
        }
        
        // Otherwise proceed with normal cart cleaning
        const cleanedCart = await cleanCart(cart);
        
        // If some items were removed, update the cart
        if (cleanedCart.length !== cart.length) {
          console.log('Cleaned cart, removed invalid products');
          setCart(cleanedCart);
        }
      } catch (error) {
        console.error('Error cleaning cart:', error);
      } finally {
        setIsCleaningCart(false);
      }
    };
    
    if (cart.length > 0) {
      cleanCartItems();
    } else {
      setIsCleaningCart(false);
    }
  }, [cart.length, setCart, setCheckoutError, blacklistLoaded]);
  
  // Validate that all products in cart exist
  const validateCartProducts = async () => {
    try {
      // Check each product in the cart to ensure it exists
      for (const item of cart) {
        const response = await fetch(`/api/products/${item.id}`);
        if (!response.ok) {
          return {
            valid: false,
            message: `Product not found: ${item.id}`
          };
        }
      }
      return { valid: true };
    } catch (error) {
      console.error('Error validating cart products:', error);
      return {
        valid: false,
        message: 'Error validating products. Please try again.'
      };
    }
  };

  const handleCheckout = async () => {
    setCheckoutInProgress(true)
    setCheckoutError('')
    try {
      // Skip product validation to allow checkout with all products
      // Even if some products can't be found in the database
      
      // Then, validate stock with the API
      const items = cart.map(item => ({
        productId: item.id,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        _stockInfo: item._stockInfo
      }));
      
      console.log('Validating stock before checkout...', items);
      
      // Call the stock validation API directly
      const response = await fetch('/api/stock/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });
      
      const data = await response.json();
      console.log('Stock validation response:', data);
      
      if (!response.ok || !data.valid) {
        console.error('Stock validation failed:', data.message);
        setCheckoutError(data.message || 'Some items in your cart are no longer available in the requested quantity.')
        setCheckoutInProgress(false)
        return;
      }
      
      // If stock validation passes, proceed to checkout
      window.location.href = '/checkout'
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutError('An unexpected error occurred. Please try again later.')
    } finally {
      setCheckoutInProgress(false)
    }
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href="/collection" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8">
            <span>←</span>
            <span>Continue Shopping</span>
          </Link>

          <h1 className="text-4xl md:text-5xl font-light mb-12">CART</h1>

          {isCleaningCart ? (
            <p className="text-center py-8">Validating cart items...</p>
          ) : cart.length === 0 ? (
            <p className="text-center py-8">Your cart is empty</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color || 'default'}`} className="flex gap-6 pb-6 border-b">
                    <div className="relative w-24 h-24">
                      <Image 
                        src={optimizeCloudinaryUrl(item.image, { width: 200 })} 
                        alt={item.name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-light">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id, item.size, item.color)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Size: {item.size === 'medium' ? 'M' : item.size === 'small' ? 'S' : item.size}</p>
                      {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, Math.max(1, item.quantity - 1), item.color)}
                            className="text-gray-500 hover:text-black"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                            className="text-gray-500 hover:text-black"
                          >
                            +
                          </button>
                        </div>
                        {item.discount ? (
                          <p className="text-red-500">
                            L.E {((item.price * (1 - item.discount/100)) * item.quantity).toFixed(0)}
                          </p>
                        ) : (
                          <p>L.E {(item.price * item.quantity).toFixed(0)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-6">
                  <h2 className="text-xl font-light mb-4">ORDER SUMMARY</h2>
                  <div className="space-y-2 pb-4 mb-4 border-b">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>L.E {cartTotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-medium mb-6">
                    <span>Total</span>
                    <span>L.E {cartTotal.toFixed(0)}</span>
                  </div>
                  {checkoutError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded">
                      {checkoutError}
                    </div>
                  )}
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutInProgress}
                    className="block w-full bg-black text-white text-center py-4 hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {checkoutInProgress ? 'PROCESSING...' : 'PROCEED TO CHECKOUT'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
} 
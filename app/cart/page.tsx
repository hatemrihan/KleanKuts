'use client'

import React from 'react'
import { useCart } from '../context/CartContext'
import Nav from '../sections/nav'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, checkoutCart } = useCart()
  const [checkoutInProgress, setCheckoutInProgress] = React.useState(false)
  const [checkoutError, setCheckoutError] = React.useState('')
  
  const handleCheckout = async () => {
    setCheckoutInProgress(true)
    setCheckoutError('')
    try {
      const success = await checkoutCart()
      if (success) {
        // Redirect to checkout page
        window.location.href = '/checkout'
      } else {
        setCheckoutError('There was an issue processing your order. Please try again.')
      }
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

          {cart.length === 0 ? (
            <p className="text-center py-8">Your cart is empty</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color || 'default'}`} className="flex gap-6 pb-6 border-b">
                    <div className="relative w-24 h-24">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
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
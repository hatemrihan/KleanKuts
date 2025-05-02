'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '../sections/nav'
import { useCart } from '../context/CartContext'

const ThankYouPage = () => {
  const router = useRouter()
  const { cart } = useCart()
  const [orderCompleted, setOrderCompleted] = useState(false)
  
  useEffect(() => {
    // Check if order was just completed by verifying that cart is empty
    const checkOrderCompleted = () => {
      const isOrderCompleted = cart.length === 0 && sessionStorage.getItem('orderCompleted') === 'true'
      
      if (!isOrderCompleted) {
        // Redirect to home page if someone tries to access thank you page directly
        router.push('/')
        return
      }
      
      setOrderCompleted(true)
    }
    
    checkOrderCompleted()
    
    // Cleanup
    return () => {
      sessionStorage.removeItem('orderCompleted')
    }
  }, [cart, router])
  
  if (!orderCompleted) {
    return null // Don't render anything during validation/redirect
  }
  
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white pt-20">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-8">THANK YOU FOR YOUR ORDER!</h1>
          
          <div className="max-w-2xl mx-auto space-y-6 text-gray-600">
            <p>
              Your order has been successfully placed. We will contact you shortly to confirm your order and delivery details.
            </p>
            <p>
              You will pay on delivery. Please have the exact amount ready.
            </p>
            <p className="text-sm">
              If you have any questions, feel free to contact us.
            </p>
          </div>

          <Link 
            href="/collection"
            className="inline-block mt-12 px-8 py-4 bg-black text-white hover:bg-gray-900 transition-colors"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </main>
    </>
  )
}

export default ThankYouPage 
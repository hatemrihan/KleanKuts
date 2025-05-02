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
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check if order was just completed
    const checkOrderCompleted = () => {
      // Get the completion flag from sessionStorage
      const completionFlag = sessionStorage.getItem('orderCompleted')
      
      if (completionFlag === 'true') {
        // Order was completed successfully
        setOrderCompleted(true)
        setIsLoading(false)
      } else {
        // No valid completion flag found - redirect after a short delay
        // This prevents flashing content before redirect
        setTimeout(() => {
          router.push('/')
        }, 300)
      }
    }
    
    checkOrderCompleted()
    
    // Cleanup on component unmount
    return () => {
      // Only remove the flag when navigating away from the page
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('orderCompleted')
      }
    }
  }, [router])
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }
  
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
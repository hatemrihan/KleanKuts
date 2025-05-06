'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '../sections/nav'

const OrderErrorPage = () => {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check if there's an error message in session storage
    const checkOrderError = () => {
      const errorData = sessionStorage.getItem('orderError')
      
      if (errorData) {
        // Parse the error message
        try {
          const errorInfo = JSON.parse(errorData)
          setErrorMessage(errorInfo.message || 'An error occurred during checkout.')
        } catch (e) {
          // If parsing fails, use the raw string
          setErrorMessage(errorData)
        }
        setIsLoading(false)
      } else {
        // No error data found - redirect after a short delay
        setTimeout(() => {
          router.push('/cart')
        }, 300)
      }
    }
    
    checkOrderError()
    
    // Cleanup on component unmount
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('orderError')
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
  
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white pt-20">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-8 text-red-600">ORDER COULD NOT BE COMPLETED</h1>
          
          <div className="max-w-2xl mx-auto space-y-6 text-gray-600">
            <p className="text-lg font-medium">
              We encountered an issue while processing your order:
            </p>
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">
                {errorMessage}
              </p>
            </div>
            <p>
              Please try again or contact our customer support if the issue persists.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <Link 
              href="/cart"
              className="inline-block px-8 py-4 bg-black text-white hover:bg-gray-900 transition-colors"
            >
              RETURN TO CART
            </Link>
            <div className="mt-4">
              <Link 
                href="/collection"
                className="inline-block px-8 py-4 border border-black text-black hover:bg-gray-100 transition-colors"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default OrderErrorPage

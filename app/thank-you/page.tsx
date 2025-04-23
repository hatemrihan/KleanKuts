'use client'

import React from 'react'
import Link from 'next/link'
import Nav from '../sections/nav'

const ThankYouPage = () => {
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
'use client'

import React from 'react'
import Link from 'next/link'
import Nav from '../sections/nav'

const ThankYouPage = () => {

  
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white dark:bg-black pt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-8 text-black dark:text-white transition-colors duration-300">SHIPPING POLICY</h1>
          
          <div className="max-w-2xl mx-auto space-y-6 text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <p>
            Shipping Coverage
  We currently ship *only within the Arab Republic of Egypt.
  <br />
Carrier
  Deliveries are handled via Engez courier service.
  <br />
Cost
  Free shipping anywhere in Egypt, with no minimum order value.
  <br />
Delivery Time
  Orders arrive within 3–5 business days from confirmation. Same‑day delivery is not available.
<br />
Order Tracking & Support
  For updates or questions, contact us via:

  Phone/WhatsApp: 01024491885
  Email: [eleve.egy.1@gmail.com](mailto:eleve.egy.1@gmail.com)
Damaged in Transit
  If your item arrives damaged during shipping, we will replace it at no extra cost. All other cases are not eligible for replacement, refund, or re‑shipment.

            </p>
            
         
       
            
            {/* Navigation buttons */}
           
            <p>
              You will pay on delivery. Please have the exact amount ready.
            </p>
            <p className="text-sm">
              If you have any questions, feel free to contact us.
            </p>
          </div>

          <Link 
            href="/"
            className="inline-block mt-12 px-8 py-4 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors duration-300"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </>
  )
}

export default ThankYouPage 
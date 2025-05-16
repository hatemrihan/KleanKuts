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
          <h1 className="text-4xl md:text-5xl font-light mb-8 text-black dark:text-white transition-colors duration-300">RETURNS && REFUND POLICY</h1>
          
          <div className="max-w-2xl mx-auto space-y-6 text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <p>
            Return Window -

            You may request a return within 7 days of receiving your order.
            <br />
Condition of Returns
Items must be unworn and in their original packaging—exactly as delivered.

<br />
Return and shipping costs

Élevé covers the cost of return shipping.
<br />
Refund method

Once we receive and inspect your return, you may choose either:

  1. Store credit, or
  2. Refund via Instapay
Exceptions
  All products are eligible; there are no final‑sale or non‑returnable items.
 <br /> Processing time
 Refunds or credits are processed within *3–7 business days* of receiving the returned item.

Phone/WhatsApp: 01024491885 <br />
Email: [eleve.egy.1@gmail.com]
<br /> Cookies
We do not use any non‑essential cookies.
<br />Privacy Inquiries
For privacy‑related questions or concerns, please contact us via the channels above.
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
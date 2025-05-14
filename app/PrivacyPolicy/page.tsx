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
          <h1 className="text-4xl md:text-5xl font-light mb-8 text-black dark:text-white transition-colors duration-300">OUR PRIVACY POLICY</h1>
          
          <div className="max-w-2xl mx-auto space-y-6 text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <p>
            Data We Collect :

 Personal information: Name, address, email, phone number, and payment details.
<br />
How We Collect Data
Via the checkout form when you place an order.Why We Collect Data

Order fulfillment (shipping address).
Accounting and payment processing.
Email and SMS marketing communications.
<br />
How We Store & Protect Data

Data is encrypted and access‑controlled, limited to our marketing and operations teams.
<br />
Data Sharing

Shared with our shipping partner (Engez) and selected marketing platforms.
 <br /> Your Rights
You may request to access, correct, or delete your personal data by contacting us at:

Phone/WhatsApp: 01024491885 <br />
Email: [eleve.egy.1@gmail.com]
<br /> Cookies
We do not use any non‑essential cookies.
<br />Privacy Inquiries
For privacy‑related questions or concerns, please contact us via the channels above.
            </p>
            
            {/* Stock reduction processing message - hidden by default */}
            <div id="processing-message" className="bg-blue-50 p-4 rounded-md text-blue-700 hidden">
              <p className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing inventory update...
              </p>
            </div>
            
            {/* Stock reduction success message - hidden by default */}
            <div id="success-message" className="bg-green-50 p-4 rounded-md text-green-700 hidden">
              <p className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Inventory has been updated successfully!
              </p>
            </div>
            
            {/* Stock reduction error message - hidden by default */}
            <div id="error-message" className="bg-red-50 p-4 rounded-md text-red-700 hidden">
              <p className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                There was an issue updating inventory. Don't worry, your order is still confirmed.
              </p>
            </div>
            
            {/* Navigation buttons */}
           
            <p>
              You will pay on delivery. Please have the exact amount ready.
            </p>
            <p className="text-sm">
              If you have any questions, feel free to contact us.
            </p>
          </div>

          <Link 
            href="/collection"
            className="inline-block mt-12 px-8 py-4 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors duration-300"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </main>
    </>
  )
}

export default ThankYouPage 
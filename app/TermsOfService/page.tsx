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
          <h1 className="text-4xl md:text-5xl font-light mb-8 text-black dark:text-white transition-colors duration-300">TERMS OF SERVICE</h1>
          
          <div className="max-w-2xl mx-auto space-y-6 text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <p>
            Governing Law & Jurisdiction
   These terms are governed by Egyptian law, and any disputes shall be brought before the courts of Cairo.
<br />
2. Who May Use the Site
   The site is open to all visitors aged 12 and above.
   <br />
3. Customer Responsibilities

    Provide *accurate information* when registering and placing orders.
    Ensure *payment for all purchases.
    <br />
4. Élevé’s Rights

    Modify prices at any time.
    Discontinue products or services without prior notice.
    Update or change any policy as needed.
    <br />
5. Intellectual Property
   All text, images, logos, and other content on the site are proprietary to Élevé and may not be used without prior written permission.
<br />
6. Limitation of Liability
   Élevé is not liable* for any direct or indirect damages arising from use of the site or products, except as provided for in the Returns Policy.
<br />
7. Dispute Resolution
   We strive to resolve any disputes amicably through negotiation. If this fails, parties may seek alternative dispute resolution or arbitration under Egyptian law.


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
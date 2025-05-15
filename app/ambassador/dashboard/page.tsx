"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AmbassadorData {
  referralLink: string;
  couponCode: string;
  status: string;
  earnings: number;
  sales: number;
  referrals: number;
  conversions: number;
  orders: number;
  paymentsPending: number;
  paymentsPaid: number;
}

const AmbassadorDashboard = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null)
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/ambassador');
      return;
    }

    const fetchAmbassadorData = async () => {
      try {
        const response = await fetch(`/api/ambassador/data?email=${encodeURIComponent(session.user?.email || '')}`);
        const data = await response.json();
        
        if (response.ok) {
          setAmbassadorData(data);
        } else {
          // If user is not an ambassador, redirect to ambassador page
          router.push('/ambassador');
        }
      } catch (error) {
        console.error('Error fetching ambassador data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAmbassadorData();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex flex-col items-center">
        <h1 className="text-3xl font-semibold mb-8">Ambassador Dashboard</h1>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // This will be handled by the useEffect redirect
  }

  if (!ambassadorData) {
    return (
      <div className="min-h-screen pt-24 px-4 flex flex-col items-center">
        <h1 className="text-3xl font-semibold mb-8">Ambassador Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Not an Ambassador</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You are not registered as an ambassador. Please apply to become an ambassador first.</p>
                <div className="mt-4">
                  <Link href="/ambassador" className="text-sm font-medium text-red-800 hover:text-red-600">
                    Go to Ambassador Application
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-semibold">Ambassador Dashboard</h1>
          <div className="mt-4 md:mt-0">
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-2 rounded-md text-sm font-medium border border-black hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300"
            >
              BACK TO ELEVE
            </Link>
          </div>
        </div>
        
        {/* Welcome Message */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-medium text-amber-800 dark:text-amber-200">
            WELCOME {session?.user?.name?.toUpperCase() || 'AMBASSADOR'}
          </h2>
          <p className="mt-2 text-amber-700 dark:text-amber-300">
            Thank you for being part of our ambassador program. You can use this dashboard to track your referrals and earnings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-medium mb-4">Referral Link</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Share this link with your friends and earn commissions on purchases made by them
            </p>
            <div className="flex items-center">
              <input 
                type="text" 
                readOnly 
                value={ambassadorData.referralLink} 
                className="flex-grow p-2 border rounded-l-md text-sm bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(ambassadorData.referralLink);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md text-sm font-medium"
              >
                Copy
              </button>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Share on:</span>
              <div className="flex items-center space-x-4">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ambassadorData.referralLink)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(ambassadorData.referralLink)}&text=${encodeURIComponent('Check out this awesome store!')}`} target="_blank" rel="noopener noreferrer" className="text-blue-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent('Check out this store! ' + ambassadorData.referralLink)}`} target="_blank" rel="noopener noreferrer" className="text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M17.415 14.382c-.298-.149-1.759-.867-2.031-.967-.272-.099-.47-.148-.669.15-.198.296-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm0-18.271A10.58 10.58 0 006.1 6.362 10.573 10.573 0 003.413 12a10.565 10.565 0 001.588 5.586l-1.51 5.507 5.649-1.482A10.578 10.578 0 0012 22.957c5.838 0 10.586-4.747 10.586-10.586 0-2.827-1.112-5.486-3.129-7.485a10.576 10.576 0 00-7.463-3.113z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href={`mailto:?subject=${encodeURIComponent('Check out this store!')}&body=${encodeURIComponent('I thought you might like this store: ' + ambassadorData.referralLink)}`} className="text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </a>
                <a href={`https://www.instagram.com/`} target="_blank" rel="noopener noreferrer" className="text-pink-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-medium mb-4">Coupon Code</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Share your coupon code with others. For every purchase someone makes using your coupon code, you get the credit
            </p>
            {ambassadorData.couponCode ? (
              <div className="flex items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={ambassadorData.couponCode} 
                  className="flex-grow p-2 border rounded-l-md text-sm bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(ambassadorData.couponCode);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            ) : (
              <div className="bg-pink-50 border border-pink-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-pink-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-pink-800">No coupon code found!</h3>
                    <div className="mt-2 text-sm text-pink-700">
                      <p>You can request us for a coupon code to share with your followers.</p>
                      <Link href="#" className="mt-2 inline-block text-pink-800 hover:text-pink-600 font-medium">
                        Contact us
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Referrals</span>
            <span className="text-3xl font-semibold">{ambassadorData.referrals}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Orders</span>
            <span className="text-3xl font-semibold">{ambassadorData.orders}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Conversions</span>
            <span className="text-3xl font-semibold">{ambassadorData.conversions}%</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Sales</span>
            <span className="text-3xl font-semibold">${ambassadorData.sales}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Earnings</span>
            <span className="text-3xl font-semibold">${ambassadorData.earnings}</span>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Amount Paid</span>
            <span className="text-3xl font-semibold">${ambassadorData.paymentsPaid}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Amount Pending</span>
            <span className="text-3xl font-semibold">${ambassadorData.paymentsPending}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-medium mb-4">Details</h2>
          {(ambassadorData.orders > 0) ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Example order row - this would be populated from actual order data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #12345
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      May 10, 2025
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      Anonymous
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      $120.00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      $60.00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Paid
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="mt-2 text-gray-500 dark:text-gray-400">No payments have been made yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AmbassadorDashboard

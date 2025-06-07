"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AmbassadorData {
  couponCode: string;
  status: string;
  earnings: number;
  sales: number;
  referrals: number;
  orders: number;
  paymentsPending: number;
  paymentsPaid: number;
  productVideoLink?: string;
  lastUpdated?: Date;
}

const AmbassadorDashboard = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null)
  const [videoLink, setVideoLink] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/ambassador');
      return;
    }

    const fetchAmbassadorData = async () => {
      try {
        // First fetch data from local API
        const response = await fetch(`/api/ambassador/data?email=${encodeURIComponent(session.user?.email || '')}`);
        const data = await response.json();
        
        if (response.ok) {
          // Set initial data
          setAmbassadorData(data);
          // Set the video link from saved data if available
          if (data.productVideoLink) {
            setVideoLink(data.productVideoLink);
          }
          
          // Then fetch latest payment data directly from admin API for more up-to-date info
          try {
            const adminDataResponse = await fetch('/api/ambassador/admin-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: session.user?.email
              }),
              cache: 'no-store'
            });
            
            if (adminDataResponse.ok) {
              const adminData = await adminDataResponse.json();
              console.log('Got fresh admin data:', adminData);
              
              // Update with the latest payment data from admin
              setAmbassadorData(prevData => {
                if (!prevData) return null; // If prevData is null, keep it null
                
                return {
                  ...prevData,
                  paymentsPaid: adminData.paymentsPaid ?? prevData.paymentsPaid,
                  paymentsPending: adminData.paymentsPending ?? prevData.paymentsPending
                };
              });
            }
          } catch (adminError) {
            console.error('Error fetching admin data:', adminError);
            // Continue with local data if admin API fails
          }
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
  
  // Function to submit video link to admin
  const validateSocialMediaUrl = (url: string) => {
    const socialMediaRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com|tiktok\.com|twitter\.com|threads\.net|vimeo\.com|snapchat\.com)\/.+/;
    return socialMediaRegex.test(url);
  };

  const submitVideoLink = async () => {
    if (!videoLink || !session?.user?.email) {
      setSubmitStatus('error');
      alert('Please enter a video link');
      return;
    }
    
    if (!validateSocialMediaUrl(videoLink)) {
      setSubmitStatus('error');
      alert('Please enter a valid social media URL from YouTube, Facebook, Instagram, TikTok, Twitter, Threads, Vimeo, or Snapchat');
      return;
    }
    
    setSubmitStatus('loading');
    
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('/api/ambassador/update-video-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: session.user.email,
            productVideoLink: videoLink
          }),
          cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Update was successful
          setSubmitStatus('success');
          // Update local state
          setAmbassadorData(prevData => {
            if (!prevData) return null;
            return {
              ...prevData,
              productVideoLink: videoLink
            };
          });
          
          // Show success alert
          alert('Video link updated successfully!');
          return;
        } else {
          // Handle specific error cases
          lastError = data.error || 'Failed to update video link';
          
          if (response.status === 404) {
            alert('Ambassador account not found. Please try logging in again.');
            return;
          }
          
          // Only continue retrying on 500 errors
          if (response.status !== 500) {
            break;
          }
        }
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = 'Network error occurred';
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    // If we get here, all attempts failed
    setSubmitStatus('error');
    alert(lastError || 'Failed to update video link. Please try again later.');
    
    // Reset status after 5 seconds
    setTimeout(() => {
      setSubmitStatus('idle');
    }, 5000);
  };

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
      <div className="min-h-screen pt-16 px-4 flex flex-col items-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Ambassador Dashboard</h1>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md shadow-xl">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Not an Ambassador</h3>
              <div className="mt-2 text-gray-600 dark:text-gray-300">
                <p>You are not registered as an ambassador. Please apply to become an ambassador first.</p>
                <div className="mt-6">
                  <Link 
                    href="/ambassador" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Apply to be an Ambassador
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
        
        {/* Video Link Input Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-medium mb-4">Product Video Link</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Share a link to your video showcasing our products. This helps us promote your content and track your influence.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Video link for the product
              </label>
              <input
                id="videoLink"
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="Enter your social media content URL..."
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=...)
              </p>
              <button
                onClick={submitVideoLink}
                disabled={submitStatus === 'loading' || !videoLink}
                className={`w-full py-3 px-4 flex justify-center items-center gap-2 
                  ${!videoLink ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' :
                    submitStatus === 'loading' ? 'bg-gray-400 dark:bg-gray-600' : 
                    'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'} 
                  text-white rounded-md text-sm font-medium transition-colors duration-300`}
              >
                {submitStatus === 'loading' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Submit Video Link
                  </>
                )}
              </button>
              {submitStatus === 'success' && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Video link submitted successfully!
                    </span>
                  </div>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700 dark:text-red-300">
                      Failed to submit video link. Please check the URL and try again.
                    </span>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Current Video Link Display */}
        {ambassadorData?.productVideoLink && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Current Video Link:
            </h3>
            <div className="flex items-center gap-2">
              <a 
                href={ambassadorData.productVideoLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline break-all"
              >
                {ambassadorData.productVideoLink}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ambassadorData.productVideoLink || '');
                  alert('Link copied to clipboard!');
                }}
                className="flex-shrink-0 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                title="Copy link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              You can submit a new video link anytime to update this.
            </p>
          </div>
        )}

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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md text-sm font-medium transition-colors duration-200"
              >
                Copy
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">No coupon code found</h3>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>You can request us for a coupon code to share with your followers.</p>
                    <Link href="#" className="mt-2 inline-block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                      Contact us
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            <span className="text-gray-500 text-sm mb-1">Sales</span>
            <span className="text-3xl font-semibold">{ambassadorData.sales} L.E</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Earnings</span>
            <span className="text-3xl font-semibold">{ambassadorData.earnings} L.E</span>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Amount Paid</span>
            <span className="text-3xl font-semibold">
              {typeof ambassadorData.paymentsPaid === 'number' ? `${ambassadorData.paymentsPaid} L.E` : 'Loading...'}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <span className="text-gray-500 text-sm mb-1">Amount Pending</span>
            <span className="text-3xl font-semibold">
              {typeof ambassadorData.paymentsPending === 'number' ? `${ambassadorData.paymentsPending} L.E` : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AmbassadorDashboard

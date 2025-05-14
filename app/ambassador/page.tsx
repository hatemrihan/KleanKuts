"use client"

import React, { useState, useEffect } from 'react'
import { useSession, signIn } from "next-auth/react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AmbassadorPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestStatus, setRequestStatus] = useState('')
  const [ambassadorStatus, setAmbassadorStatus] = useState('none') // 'none', 'pending', 'approved'

  useEffect(() => {
    // If user is logged in, check if they're already an ambassador or have a pending request
    if (session?.user?.email) {
      fetch(`/api/ambassador/status?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => {
          setAmbassadorStatus(data.status || 'none')
        })
        .catch(err => {
          console.error('Error checking ambassador status:', err)
        })
    }
  }, [session])

  const handleAmbassadorRequest = async () => {
    if (!session) {
      signIn('google')
      return
    }

    setIsRequesting(true)
    setRequestStatus('')

    try {
      const response = await fetch('/api/ambassador/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: session.user?.name,
          email: session.user?.email,
          userId: session.user?.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setRequestStatus('success')
        setAmbassadorStatus('pending')
      } else {
        setRequestStatus('error')
      }
    } catch (error) {
      console.error('Error submitting ambassador request:', error)
      setRequestStatus('error')
    } finally {
      setIsRequesting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-24 px-4 flex flex-col items-center">
        <h1 className="text-3xl font-semibold mb-8">Ambassador Program</h1>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is already an approved ambassador, redirect to dashboard
  if (ambassadorStatus === 'approved') {
    router.push('/ambassador/dashboard')
    return (
      <div className="min-h-screen pt-24 px-4 flex flex-col items-center">
        <h1 className="text-3xl font-semibold mb-8">Ambassador Program</h1>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-center">Ambassador Program</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-medium mb-4">Join Our Ambassador Program</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Become an Eleve ambassador and earn commissions on sales made through your
            unique referral link. Share your love for our products with your audience
            and get rewarded for every purchase they make!
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-500">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Apply to become an ambassador</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Fill out a simple application to join our program
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-500">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Get approved</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Our team will review your application and approve you
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-500">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Share your unique referral link</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Share your custom referral link and promo code with your audience
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-500">
                  4
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Earn commissions</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Earn a 50% commission on every purchase made with your referral link or code
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {!session ? (
              <button
                onClick={() => signIn('google')}
                className="w-full py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm"
              >
                Sign in to Apply
              </button>
            ) : ambassadorStatus === 'pending' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Application Pending</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Your application is currently under review. We'll notify you once it's approved!</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAmbassadorRequest}
                disabled={isRequesting}
                className="w-full py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? 'Submitting...' : 'Apply Now'}
              </button>
            )}

            {requestStatus === 'success' && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Application Submitted</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your application has been submitted successfully! We'll review it and get back to you soon.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {requestStatus === 'error' && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>There was an error submitting your application. Please try again later.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-medium mb-4">Ambassador Benefits</h2>
          <ul className="space-y-4 text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-6 w-6 text-green-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3">Earn a generous 50% commission on all sales through your referral link</span>
            </li>
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-6 w-6 text-green-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3">Get exclusive early access to new product launches</span>
            </li>
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-6 w-6 text-green-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3">Access to special ambassador-only promotions and discounts</span>
            </li>
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-6 w-6 text-green-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3">Personalized support from our dedicated ambassador management team</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AmbassadorPage

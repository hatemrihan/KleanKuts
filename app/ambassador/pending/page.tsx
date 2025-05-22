"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function AmbassadorPendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [applicationDate, setApplicationDate] = useState<string | null>(null);

  useEffect(() => {
    if (!session || status !== 'authenticated') return;
    
    // Get email from the URL query parameters or the session
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const userEmail = emailParam || session?.user?.email;
    setEmail(userEmail || null);
    
    // Set today's date for new applications
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    setApplicationDate(dateString);
    
    // If we have an email, check the application status from the admin panel
    if (userEmail) {
      // Check application status from admin panel API
      const checkApplicationStatus = async () => {
        try {
          const response = await fetch(`/api/ambassador/status?email=${encodeURIComponent(userEmail)}`);
          
          if (!response.ok) {
            // If we get a 404, user doesn't have an application
            if (response.status === 404) {
              router.push('/ambassador/apply');
              return;
            }
            throw new Error(`Error ${response.status}`);
          }
          
          const data = await response.json();
          
          // If application doesn't exist or was rejected, go to application page
          if (!data.application || data.application.status === 'rejected') {
            router.push('/ambassador/apply');
          }
          
          // If application is approved, go to dashboard
          if (data.application && data.application.status === 'approved') {
            router.push('/ambassador/dashboard');
          }
          
          // Otherwise we're in pending status, which is correct for this page
        } catch (error) {
          console.error('Error checking application status:', error);
          // Stay on this page if there's an error checking status
        }
      };
      
      checkApplicationStatus();
    }
  }, [session, router]);

  // Wait for authentication to complete
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-x-hidden flex items-center justify-center">
        <div className="text-3xl font-serif animate-pulse">ELEVE</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-x-hidden">
      <header className="container max-w-screen-xl mx-auto px-6 md:px-12 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif">ELEVE</Link>
          <Link href="/ambassador" className="text-sm underline">Back to Ambassador Program</Link>
        </div>
      </header>

      <main className="container max-w-screen-xl mx-auto px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 rounded-full text-sm font-medium mb-4">
              Application Pending
            </span>
            <h1 className="text-3xl md:text-4xl font-medium mb-4">Thank You for Applying!</h1>
            <p className="text-black/70 dark:text-white/70">
              Your application to become an Élevé Ambassador is currently under review.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-medium mb-4">Application Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-300">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Pending Review</h3>
                  <p className="text-sm text-black/70 dark:text-white/70">
                    Submitted on {applicationDate || 'recently'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Application Reviewed</h3>
                  <p className="text-sm text-black/70 dark:text-white/70">
                    Waiting for our team to review your application
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Ambassador Approved</h3>
                  <p className="text-sm text-black/70 dark:text-white/70">
                    You'll receive an email once approved
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-medium mb-4">What's Next?</h2>
            <p className="mb-4">
              Our team is currently reviewing your application. This process typically takes 3-5 business days.
              You'll receive an email at <span className="font-medium">{email || 'your registered email'}</span> once your 
              application has been reviewed.
            </p>
            <p>
              If approved, you'll receive:
            </p>
            <ul className="list-disc pl-5 mt-2 mb-4 space-y-1">
              <li>Your unique ambassador referral link</li>
              <li>Personalized discount code for your followers</li>
              <li>Access to the Ambassador Dashboard</li>
              <li>Marketing materials and guidelines</li>
            </ul>
            <p>
              Please make sure to check your email (including spam/promotions folders) for updates.
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-black/70 dark:text-white/70 mb-4">
              Have questions about your application? Contact us at<br />
              <a href="mailto:eleve.egy.1@gmail.com" className="underline">
                eleve.egy.1@gmail.com
              </a>
            </p>
            
            <Link 
              href="/" 
              className="inline-block px-6 py-3 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              Return to Home Page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

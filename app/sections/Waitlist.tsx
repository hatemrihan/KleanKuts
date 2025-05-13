"use client";

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import Nav from '@/app/sections/nav';
import { toast } from 'react-hot-toast';

const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Connect to admin panel with proper CORS handling (now configured on backend)
      console.log('Submitting email to admin waitlist:', email);
      
      const response = await fetch('https://eleveadmin.netlify.app/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          source: 'website'
        }),
        // No longer using no-cors mode since backend has CORS configured
        credentials: 'omit'
      });
      
      // Now we can properly parse the JSON response
      const data = await response.json();
      console.log('Waitlist submission response:', data);
      
      // Check for specific success or exists message from the API
      if (data.message === 'Successfully added to waitlist' || data.exists) {
        // Record the submission in localStorage as backup
        try {
          const existingEntries = localStorage.getItem('elevee_waitlist_entries') || '[]';
          const entries = JSON.parse(existingEntries);
          entries.push({
            email,
            date: new Date().toISOString(),
            status: data.exists ? 'already_exists' : 'submitted'
          });
          localStorage.setItem('elevee_waitlist_entries', JSON.stringify(entries));
          
          localStorage.setItem('elevee_waitlist_last', JSON.stringify({
            email,
            date: new Date().toISOString(),
            status: data.exists ? 'already_exists' : 'submitted'
          }));
        } catch (storageError) {
          console.error('Failed to save to localStorage:', storageError);
        }
        
        // Show thank you page and success message
        setIsSubmitted(true);
        toast.success(data.exists ? 
          'You\'re already on our waitlist!' : 
          'Thanks for joining our waitlist!');
        
        // Track analytics event
        if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'waitlist_submission', {
            'event_category': 'engagement',
            'event_label': 'waitlist',
            'status': data.exists ? 'already_exists' : 'new'
          });
        }
      } else {
        // API returned but with an unexpected response
        throw new Error(data.error || 'Unexpected API response');
      }
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
      
      // Fall back to local storage if the API fails
      try {
        // Save to local storage as fallback
        const existingWaitlist = localStorage.getItem('waitlist') || '[]';
        const waitlist = JSON.parse(existingWaitlist);
        waitlist.push({
          email,
          date: new Date().toISOString(),
          status: 'pending' // Mark as pending since it failed to reach admin
        });
        localStorage.setItem('waitlist', JSON.stringify(waitlist));
        console.log('Email saved to local storage as fallback');
        
        // Still show success to user but log the error for admin
        setIsSubmitted(true);
        toast.success('Thanks for joining our waitlist!'); 
      } catch (localError) {
        console.error('Failed to save to local storage:', localError);
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300">
      {/* Navigation */}
      <Nav />
      
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center text-center">            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-8 max-w-4xl">Eleve Egypt | Luxury Clothing Brand in Egypt 
              <br />
             Premium Quality
            </h1>
            
            {!isSubmitted ? (
              <>
                <p className="text-gray-600 dark:text-white/80 mb-12 transition-colors duration-300">JOIN OUR WAITLIST</p>
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                  <div className="flex flex-col sm:flex-row gap-3 w-full border-b border-black dark:border-white pb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Write your email here."
                      className="flex-grow px-0 py-2 bg-transparent border-none text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none transition-colors duration-300"
                      disabled={isSubmitting}
                    />
                    <button
                      type="submit"
                      className={`px-6 py-2 font-medium transition-colors ${isSubmitting ? 'text-gray-400 cursor-not-allowed' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-200'}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send →'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center py-12 max-w-2xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-black dark:text-white">
                  THANK YOU FOR JOINING OUR WAITLIST!
                </h2>
                
                <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg w-full mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-green-800 dark:text-green-200 text-lg mb-2">
                    Your email has been successfully added!
                  </p>
                  <p className="text-green-700 dark:text-green-300">
                    We'll keep you updated on our latest collections and exclusive offers.
                  </p>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  You'll be among the first to know when we launch new products and exclusive collections.
                </p>
                
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="py-3 px-8 bg-black text-white dark:bg-white dark:text-black font-medium transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 mb-4"
                >
                  Subscribe Another Email
                </button>
                
                <Link href="/collection" className="text-black dark:text-white underline">
                  Explore Our Collection
                </Link>
              </div>
            )}
          </div>
        </section>
        
        {/* Video Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
          <div className=" overflow-hidden shadow-2xl shadow-gray-200 dark:shadow-white/10 w-full relative aspect-video transition-shadow duration-300">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover grayscale"
            >
              <source src="/videos/waitlist.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>
        
        {/* Thank You Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center">
          <h2 className="text-3xl font-bold mb-8 transition-colors duration-300">ELEVE</h2>
          
          <p className="text-gray-600 dark:text-white/80 mb-6 max-w-2xl mx-auto transition-colors duration-300">
            We just wanted to thank you all for such intense support over our first drop. We're dedicated to
            continuing growth of this store alongside our community, and look forward to what is to come.
          </p>
          
          <p className="text-xl font-semibold mb-8 transition-colors duration-300">P.S. TAKE ACTION.</p>
          
          <div className="flex justify-center space-x-6">
            <Link href="https://instagram.com" className="text-white hover:text-white/80 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </Link>
            <Link href="https://tiktok.com" className="text-white hover:text-white/80 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
                <path d="M15 8v8"></path>
                <path d="M9 16v8"></path>
                <path d="M15 8a4 4 0 0 0 4 4"></path>
                <path d="M15 4a4 4 0 0 0-4 4h8"></path>
              </svg>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Waitlist;

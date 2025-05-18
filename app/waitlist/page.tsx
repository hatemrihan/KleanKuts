"use client";

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { submitToWaitlist } from '../../lib/adminIntegration';

export default function WaitlistPage() {
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
      const success = await submitToWaitlist(email, 'website');
      
      if (success) {
        setIsSubmitted(true);
        toast.success('Thanks for joining our waitlist!');
        
        // Save successful submission to localStorage
        const storageData = {
          email,
          date: new Date().toISOString(),
          status: 'success'
        };
        localStorage.setItem('waitlist_last_submission', JSON.stringify(storageData));
      } else {
        toast.error('Unable to join waitlist. Please try again later.');
      }
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Video background */}
      <div className="fixed inset-0 w-full h-full z-0 opacity-50">
        <video 
          className="object-cover w-full h-full"
          autoPlay 
          muted 
          loop 
          playsInline
          src="/videos/waitlist.mp4"
        >
          Your browser does not support the video tag.
        </video>
      </div>
      
      {/* Waitlist content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/">
            <img src="/logo-white.png" alt="ELEVE" className="h-16" />
          </Link>
        </div>
        
        {/* Waitlist Form */}
        <div className="w-full max-w-md p-8 bg-black/60 backdrop-blur-md rounded-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">Join Our Waitlist</h1>
          
          {isSubmitted ? (
            <div className="text-center">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-semibold mb-4">Thank You!</h2>
              <p className="mb-6">You've been added to our waitlist. We'll notify you when we launch.</p>
              <Link href="/" className="inline-block px-6 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition duration-300">
                Return Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg font-medium transition duration-300 ${
                  isSubmitting 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
              
              <p className="text-sm text-center text-gray-400 mt-4">
                Be the first to know when we launch. No spam, just updates.
              </p>
            </form>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} ELEVE. All rights reserved.</p>
          <div className="mt-2">
            <Link href="/PrivacyPolicy" className="hover:text-white mr-4">Privacy Policy</Link>
            <Link href="/TermsOfService" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
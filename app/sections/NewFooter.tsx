"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const NewFooter = () => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSending(true);
      
      // Submit email to the newsletter API
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'website_footer'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success
        toast.success(data.message || 'Thanks for subscribing!');
        setEmail('');
      } else {
        // Error
        toast.error(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <footer id="contact" className="w-full bg-white dark:bg-black text-black dark:text-white py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Section - Email Subscription */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
         
          <form onSubmit={handleSubmit} className="w-full md:w-auto max-w-md">
            <div className="relative border-b border-black/20 dark:border-white/20 flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gmail.com"
                className="w-full bg-transparent py-3 pr-20 focus:outline-none text-black dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={isSending}
                className="absolute right-0 bottom-3 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isSending ? 'Joining...' : 'Join'} {!isSending && <span className="text-lg">→</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Middle Section - Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div>
            <h3 className="font-medium mb-4">Find US</h3>
            <ul className="space-y-3">
              <li><Link href="https://www.instagram.com/eleve__egy?igsh=b3NnYWw4eWgxcTcw" className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">INSTAGRAM</Link></li>
              <li><Link href="https://www.tiktok.com/@eleve__egy/" className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">TIKTOK</Link></li>
              <li><Link href="mailto:eleve.egy.1@gmail.com" className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">GMAIL</Link></li>
              <li><Link href="https://eleveadmin.netlify.app/" className="text-sm font-extralight text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">ad</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4">KNOW MORE</h3>
            <ul className="space-y-3">
              <li><Link href="/ShippingPolicy" className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">SHIPPING POLICY</Link></li>
              <li><Link href="/RefundPolicy" className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors uppercase">Refund & Returns Policy</Link></li>
              <li><Link href="/TermsOfService" className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors uppercase">Terms of Service</Link></li>
              <li><Link href="/PrivacyPolicy" className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors uppercase">Privacy Policy</Link></li>

            </ul>
          </div>
          
        </div>

        {/* Logo */}
        <div className="text-center mb-8 w-full px-0 overflow-hidden">
          <h1 className="text-black dark:text-white leading-none m-0 p-0" 
              style={{ 
                fontSize: 'clamp(4rem, 25vw, 18rem)',
                letterSpacing: '0.01em',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                marginRight: 'calc(-50vw + 50%)',
                textAlign: 'center',
                display: 'block',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontFamily: 'serif',
                fontWeight: '900',
                textTransform: 'uppercase'
              }}>
            Eleve
          </h1>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-black/70 dark:text-white/70">
            &copy; HAPPILY DEVELOPED BY{' '}
            <Link href="https://hatum.vercel.app/" className="underline hover:text-black dark:hover:text-white transition-colors">
              HATUM
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default NewFooter;
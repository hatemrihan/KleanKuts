"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const Footer = () => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      window.location.href = `mailto:kenzyzayed04@gmail.com?subject=New Message from Website&body=${encodeURIComponent(message)}`;
      setMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <footer id="contact" className="bg-white text-black py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Left Section */}
          <div className="space-y-12">
            <div id="about" className="space-y-2">
              <h3 className="font-medium">ABOUT</h3>
              <p className="text-sm text-black/70 ">
              experience unmatched luxury with our premium sets, expertly crafted for exceptional comfort and enduring style.
              </p>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-light tracking-tight">
              GET IN TOUCH
            </h1>
            
            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="max-w-md">
              <div className="relative">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..." 
                  className="w-full bg-transparent border-b border-black/20 py-2 pr-20 focus:outline-none focus:border-black transition-colors"
                />
                <button 
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="absolute right-0 bottom-2 text-sm text-black/70 hover:text-black disabled:opacity-50 transition-colors"
                >
                  {isSending ? 'Sending...' : 'Send →'}
                </button>
              </div>
            </form>

            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="font-medium">Place</h3>
                <p className="text-sm text-black/70">
                  CAIRO &&  Delivering all over Egypt.
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col justify-between">
            <div className="relative h-80 w-full overflow-hidden">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover grayscale"
              >
                <source src="/videos/model.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="mt-12 space-y-12">
              {/* Social Links */}
              <div className="flex gap-6 text-sm">
               
                <Link href="https://www.instagram.com/kleankuts_?igsh=MWJiaG40ZDVubDVhNA==" className="hover:opacity-70 transition-opacity">
                  INSTAGRAM
                </Link>
                <Link href="https://www.tiktok.com/@kleankuts?_t=ZS-8viW6yr2prk&_r=1" className="hover:opacity-70 transition-opacity">
                  TIKTOK
                </Link>
                <Link href="mailto:kenzyzayed04@gmail.com" className="hover:opacity-70 transition-opacity">
                  GMAIL
                </Link>
              </div>

              {/* Admin Link */}
              <div className="text-center">
                <Link href="https://kleankutsadmin.netlify.app/" className="text-xs text-black/30 hover:text-black/50 transition-opacity">
                  ad
                </Link>
              </div>

              {/* Copyright */}
              <div className="flex justify-between items-center">
                <p className="text-xs text-black/70">
                  © HAPPILY DEVELOPED BY{' '}
                  <Link href="https://hatum.vercel.app/" className="underline hover:text-black transition-colors">
                    HATUM
                  </Link>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-light">©</span>
                  <span className="text-4xl font-light">25</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
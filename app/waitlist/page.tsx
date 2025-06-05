"use client";

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useScroll, useTransform, motion } from 'framer-motion';
import useTextRevealAnimation from '../hooks/UsingTextRevealAnimation';
import { submitToWaitlist } from '../../lib/adminIntegration';

const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollingDiv = useRef<HTMLDivElement>(null);
  const {scrollYProgress} = useScroll({
    target: scrollingDiv,
    offset: ["start end", "end end"]
  });
  const portraitWidth = useTransform(scrollYProgress, [0,1], ['100%', '240%']) ;
  const {scope, controls, entranceAnimation} = useTextRevealAnimation();
  useEffect(()=>{
    entranceAnimation();
  },[entranceAnimation]);
   const handleClickMobileNavItem= (e:React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setIsOpen(false);
      const url = new URL(e.currentTarget.href);
      const hash = url.hash;
      const target = document.querySelector(hash);
      if (!target) return;
      target.scrollIntoView({behavior:'smooth'});
    }
    const [isOpen, setIsOpen] = useState(false);
    // Animation will run automatically when component mounts (handled by the hook)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid e-mail');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('[SUBMIT] Submitting email:', email);
      const success = await submitToWaitlist(email);
      
      if (success) {
        setIsSubmitted(true);
        toast.success('Thanks for joining our wait-list!');
      } else {
        toast.error('Could not add e-mail – try again in a minute.');
      }
    } catch (error) {
      console.error('[SUBMIT] Error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300">
      {/* Navigation */}
     
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center py-12 max-w-2xl mx-auto text-center">
            <motion.h1 
              ref={scope}
              initial={{ opacity: 0, y: 50 }}
              animate={controls}
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-10 max-w-4xl uppercase tracking-wider"
            >
              <span>Eleve Egypt </span>
              <br />
              <span className="font-light">Luxury StreetWear  </span>
            </motion.h1>
            
            {!isSubmitted ? (
              <>
                <p className="text-gray-600 dark:text-white/80 mb-12 transition-colors duration-300 uppercase tracking-widest font-medium">JOIN OUR WAITLIST</p>
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                  <div className="flex flex-col sm:flex-row gap-3 w-full border-b border-black dark:border-white pb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Write your email here."
                      className="flex-grow px-0 py-2 bg-transparent border-none text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none transition-colors duration-300 text-center uppercase tracking-widest font-medium"
                      disabled={isSubmitting}
                      style={{ textAlign: 'center' }}
                    />
                    <button
                      type="submit"
                      className={`px-6 py-2 font-medium uppercase tracking-widest transition-colors ${isSubmitting ? 'text-gray-400 cursor-not-allowed' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-200'}`}
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
                
                {/* <Link href="/collection" className="text-black dark:text-white underline">
                  Explore Our Collection
                </Link> */}
              </div>
            )}
          </div>
        </section>
          {/* Video Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
          <div className="overflow-hidden shadow-2xl shadow-gray-200 dark:shadow-white/10 w-full relative aspect-video transition-shadow duration-300">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              controls={false}
              onError={(e) => {
                console.error("Video loading error:", e);
                const video = e.target as HTMLVideoElement;
                if (video && typeof video.load === 'function') {
                  // Try to reload the video with a different source
                  video.src = process.env.NODE_ENV === 'development'
                    ? '/videos/waitlist.mp4'  // Local path
                    : 'https://elevee.netlify.app/videos/waitlist.mp4'; // Production path
                  
                  video.load();
                  video.play().catch(err => {
                    console.error("Video play error:", err);
                    // If play fails, show the poster image
                    if (video.parentElement) {
                      video.parentElement.style.backgroundImage = "url('/images/brand-image.jpg')";
                      video.parentElement.style.backgroundSize = "cover";
                      video.parentElement.style.backgroundPosition = "center";
                    }
                  });
                }
              }}
              onLoadedData={(e) => {
                console.log("Video loaded successfully");
                const video = e.target as HTMLVideoElement;
                if (video) {
                  video.play().catch(err => {
                    console.error("Video play error:", err);
                    // If autoplay fails, try without sound
                    video.muted = true;
                    video.play().catch(err2 => console.error("Muted play error:", err2));
                  });
                }
              }}
              className="absolute inset-0 w-full h-full object-cover"
              poster="/images/brand-image.jpg"
            >
              <source 
                src={process.env.NODE_ENV === 'development'
                  ? '/videos/waitlist.mp4'  // Local path
                  : 'https://elevee.netlify.app/videos/waitlist.mp4' // Production path
                } 
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>
        
        {/* Thank You Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            className="text-3xl font-bold mb-8 transition-colors duration-300 uppercase tracking-wider"
          >
            ELEVE
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            transition={{ delay: 0.2 }}
            className="text-gray-800 dark:text-white/90 mb-6 max-w-2xl mx-auto transition-colors duration-300 uppercase tracking-wider font-medium"
          >
            We just wanted to thank you all for such intense support over our first drop. We're dedicated to
            continuing growth of this store alongside our community, and look forward to what is to come.
          </motion.p>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            transition={{ delay: 0.4 }}
            className="text-xl font-semibold mb-8 transition-colors duration-300 uppercase tracking-wider"
          >
            P.S. TAKE ACTION.
          </motion.p>
          
          <div className="flex justify-center space-x-8">
            {/* Instagram */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={controls}
              transition={{ delay: 0.6 }}
            >
              <Link href="https://www.instagram.com/eleve__egy?igsh=b3NnYWw4eWgxcTcw" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
            </motion.div>
            
            {/* TikTok */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={controls}
              transition={{ delay: 0.7 }}
            >
              <Link href="https://www.tiktok.com/@eleve__egy/" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"/>
                </svg>
              </Link>
            </motion.div>
            
            {/* Gmail */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={controls}
              transition={{ delay: 0.8 }}
            >
              <Link href="mailto:eleve.egy.1@gmail.com" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                </svg>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Waitlist;

"use client"

import React, { useState, useEffect } from 'react'
import { motion, useAnimate, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'

const navItems = [
  {
    label: 'HOME',
    href: '/',
  },
  {
    label: 'SHOP COLLECTION',
    href: '/collection',
  },
 
  
  {
    label: 'BE OUR AMBASSADOR',
    href: '/ambassador',
  },
];



const CloseIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="hover:scale-110 transition-transform"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [navScope, navAnimate] = useAnimate();
  const { itemCount } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';

    if (isOpen) {
      navAnimate(navScope.current, {
        height: "100%"
      }, {
        duration: 0.7,
      });
    } else {
      navAnimate(navScope.current, {
        height: 0
      });
    }
  }, [isOpen, navScope, navAnimate]);

  const handleCartClick = (e: React.MouseEvent) => {
    router.push('/cart');
  };

  const handleNavClick = (e: React.MouseEvent, href: string, isScroll?: boolean) => {
    if (isScroll && href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      
      // If we're not on the homepage, navigate to the homepage first
      if (window.location.pathname !== '/') {
        router.push(`/${href}`);
        return;
      }
      
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Improved smooth scrolling with offset for the fixed header
        const headerHeight = 64; // Height of the fixed header in pixels
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without reloading the page
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', href);
        }
      } else {
        // If element not found, navigate to home with the hash
        router.push(href);
      }
      
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <style jsx global>{`
        .logo-text {
          font-family: "League Spartan", sans-serif;
          font-optical-sizing: auto;
          font-weight: 900;
          font-style: normal;
          letter-spacing: 0.2em;
          text-transform: none;
        }

        .est-text {
          font-family: "League Spartan", sans-serif;
          font-size: 0.6rem;
          font-weight: 300;
          letter-spacing: 0.2em;
          opacity: 0.7;
        }
        
        /* Y-axis flip animation (vertical flip) */
        @keyframes flipY {
          0% { transform: perspective(400px) rotateY(0deg); }
          50% { transform: perspective(400px) rotateY(180deg); }
          100% { transform: perspective(400px) rotateY(360deg); }
        }
        
        .logo-rotate {
          animation: flipY 3s linear infinite;
          display: inline-block;
          transform-style: preserve-3d;
          perspective: 800px;
        }
        
        /* Tooltip styles */
        .tooltip {
          position: relative;
        }
        
        .tooltip:hover::after {
          content: 'Log in!';
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 10;
        }
        
        /* Logo rotation animation */
        @keyframes logo-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .logo-rotate:hover {
          animation: logo-spin 5s linear infinite;
        }

        /* EXTREME image background removal - applies to ALL images */
        img {
          background-color: transparent !important;
          background: none !important;
          mix-blend-mode: normal !important;
          isolation: isolate !important;
          -webkit-mask-image: none !important;
          mask-image: none !important;
          box-shadow: none !important;
        }
        
        /* Force dark mode images to be completely transparent */
        .dark img {
          background-color: transparent !important;
          background: none !important;
          background-image: none !important;
          mix-blend-mode: normal !important;
          -webkit-filter: drop-shadow(0 0 0 transparent) !important;
          filter: drop-shadow(0 0 0 transparent) !important;
        }
        
        /* Override ALL image backgrounds at the highest specificity */
        html body img, html body .dark img, :root img, #__next img {
          background-color: transparent !important;
          background-image: none !important;
          -webkit-mask-image: none !important;
          mask-image: none !important;
        }
        
        /* Target specific image containers */
        [class*="product"] img,
        [class*="item"] img,
        [class*="card"] img {
          background: transparent !important;
        }
        
      `}</style>
      <div className="w-full bg-white dark:bg-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation - Properly Centered */}
          <div className="hidden md:flex items-center justify-center h-16 w-full">
            {/* Single wrapper for all navigation elements */}
            <div className="flex items-center justify-between w-full max-w-6xl">
              {/* Logo - Left Section */}
              <div className="flex-shrink-0">
                <Link href="/" className="text-2xl font-bold text-yellow-500 dark:text-yellow-500">
                  Eleve
                </Link>
              </div>
              
              {/* Desktop Nav Links - Center Section */}
              <div className="flex space-x-8">
                {navItems.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={(e) => handleNavClick(e, href)}
                    className="text-sm font-light text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer relative group"
                  >
                    {label}
                    <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
              </div>
              
              {/* Auth and Cart Section - Right Section */}
              <div className="flex items-center space-x-8">
                {status === 'loading' ? (
                  <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
                ) : session ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-yellow-500 dark:text-yellow-500">
                      {session.user?.name}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="text-sm text-yellow-500 dark:text-yellow-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => signIn('google')}
                    className="text-sm text-yellow-500 dark:text-yellow-500 hover:text-red-500 dark:hover:text-red-400 transition-colors tooltip"
                  >
                    Sign in
                  </button>
                )}

                {/* Theme Toggle Button */}
                <div className="mr-2">
                  <ThemeToggle />
                </div>
              </div>
              
              <Link 
                href="/cart" 
                className="relative text-yellow-500 dark:text-yellow-500 hover:text-red-500 dark:hover:text-red-400 px-3 py-2 text-sm font-light cursor-pointer group flex items-center gap-2"
                onClick={handleCartClick}
              >
                <div className="relative">
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="relative text-black dark:text-white">
                  Cart
                  <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link>
            </div>
          </div> 

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-between h-16">
            {/* Mobile Menu Button (Left) */}
            <div>
              {!isOpen && (
                <button 
                  className="flex flex-col justify-center items-center w-6 h-6 relative cursor-pointer gap-1.5"
                  onClick={() => setIsOpen(true)}
                  aria-label="Open Menu"
                >
                  <span className="w-6 h-0.5 bg-yellow-500 dark:bg-yellow-500 transition-all"></span>
                  <span className="w-6 h-0.5 bg-yellow-500 dark:bg-yellow-500 transition-all"></span>
                  <span className="w-6 h-0.5 bg-yellow-500 dark:bg-yellow-500 transition-all"></span>
                </button>
              )}
            </div>

            {/* Mobile Logo (Center with rotation) */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <Link href="/" className="text-2xl font-bold text-yellow-600 dark:text-yellow-600 logo-rotate inline-block">
                Eleve
              </Link>
            </div>

            {/* Mobile Cart and Sign In (Right) */}
            <div className="flex items-center gap-3">
              {status === 'loading' ? (
                <div className="w-6 h-6 animate-pulse bg-gray-200 rounded-full"></div>
              ) : session ? (
                <button
                  onClick={() => signOut()}
                  className="text-sm text-yellow-500 dark:text-yellow-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#eab308">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="text-sm text-yellow-500 dark:text-yellow-500 hover:text-red-500 dark:hover:text-red-400 transition-colors tooltip"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#eab308">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}

              <Link 
                href="/cart" 
                className="flex items-center justify-center text-yellow-500 dark:text-yellow-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                onClick={handleCartClick}
              >
                <div className="relative">
                  <span className="text-sm font-light">Cart</span>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className="fixed inset-0 bg-white dark:bg-black z-40 overflow-hidden transition-all duration-200"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden'
        }}
        ref={navScope}
      >
        {/* Close button positioned on top */}
        <AnimatePresence>
          {isOpen && (
            <motion.button
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-5 right-4 z-50 md:hidden flex items-center justify-center w-6 h-6 cursor-pointer text-yellow-500 dark:text-yellow-500"
              onClick={() => setIsOpen(false)}
              aria-label="Close Menu"
            >
              <CloseIcon />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Mobile menu content with absolute centering */}
        <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full">
          <div className="text-center space-y-8 w-full max-w-sm mx-auto">
            {/* Navigation links */}
            {navItems.map(({ label, href }) => (
              <div key={label} className="text-center">
                <Link
                  href={href}
                  onClick={(e) => {
                    handleNavClick(e, href);
                    setIsOpen(false);
                  }}
                  className="relative inline-block text-black dark:text-white text-2xl font-light hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer text-center group"
                >
                  {label}
                  <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </div>
            ))}
            
            {/* Theme toggle button - CENTERED */}
            <div className="flex justify-center items-center w-full pt-4">
              <button 
                onClick={toggleTheme}
                className="inline-flex items-center justify-center mx-auto p-3 rounded-full"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <div className="flex items-center justify-center">
                  {theme === 'dark' ? (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#eab308">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#eab308">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
            
            {/* Cart centered in mobile menu */}
            <div className="flex justify-center w-full">
              <Link href={'/cart'} aria-label='Open cart' onClick={() => setIsOpen(false)} className='flex flex-col items-center justify-center text-yellow-500 dark:text-yellow-500'>
                <div className="relative">
                  <span className="text-2xl font-light text-black dark:text-white">Cart</span>
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

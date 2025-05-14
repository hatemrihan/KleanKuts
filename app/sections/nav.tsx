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
  // {
  //   label: 'HOME',
  //   href: '/',
  // },
  // {
  //   label: 'SHOP COLLECTION',
  //   href: '/collection',
  // },
  // {
  //   label: 'ABOUT',
  //   href: '/#about',
  //   isScroll: true
  // },
  // {
  //   label: 'MEN COLLECTION',
  //   href: '/collection/men',
  //   isScroll: true
  // },
  // {
  //   label: 'FAQS',
  //   href: '/#faqs',
  //   isScroll: true
  // },
  {
    label: 'SAY HI',
    href: '/#contact',
    isScroll: true
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isScroll?: boolean) => {
    if (isScroll && href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const element = document.getElementById(targetId);
      
      if (element) {
        setIsOpen(false);
        const navHeight = 64;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      } else if (window.location.pathname !== '/') {
        router.push(`/${href}`);
      }
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
        
      `}</style>
      <div className="w-full bg-white dark:bg-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-black dark:text-white">
                Eleve
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="flex space-x-8">
              {navItems.map(({ label, href, isScroll }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={(e) => handleNavClick(e, href, isScroll)}
                  className="text-sm font-light text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer relative group"
                >
                  {label}
                  <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Auth and Cart Section */}
          <div className="flex items-center space-x-8">
              {status === 'loading' ? (
                <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
              ) : session ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-black dark:text-white">
                    {session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="text-sm text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors tooltip"
                >
                  Sign in
                </button>
              )}

              {/* Theme Toggle Button */}
              <div className="mr-2">
                <ThemeToggle />
              </div>
              
              {/* <Link 
                href="/cart" 
                className="relative text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 px-3 py-2 text-sm font-light cursor-pointer group flex items-center gap-2"
                onClick={handleCartClick}
              >
                <div className="relative">
                  <svg 
                    className="w-5 h-5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="relative">
                  Cart
                  <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link> */}
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
                  <span className="w-6 h-0.5 bg-black dark:bg-white transition-all"></span>
                  <span className="w-6 h-0.5 bg-black dark:bg-white transition-all"></span>
                  <span className="w-6 h-0.5 bg-black dark:bg-white transition-all"></span>
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
                  className="text-sm text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="text-sm text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors tooltip"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}

              {/* <Link 
                href="/cart" 
                className="flex items-center justify-center text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors"
                onClick={handleCartClick}
              >
                <div className="relative">
                  <svg 
                    className="w-6 h-6" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className="fixed inset-0 bg-white dark:bg-black z-40 overflow-hidden transition-all duration-300"
        style={{ height: 0 }}
        ref={navScope}
      >
        {/* Close button positioned on top */}
        <AnimatePresence>
          {isOpen && (
            <motion.button 
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-5 right-4 z-50 md:hidden flex items-center justify-center w-6 h-6 cursor-pointer text-black dark:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Close Menu"
            >
              <CloseIcon />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="h-full flex flex-col items-center justify-center">
          <div className="space-y-8">
            {navItems.map(({ label, href, isScroll }) => (
              <Link
                key={label}
                href={href}
                onClick={(e) => {
                  handleNavClick(e, href, isScroll);
                  setIsOpen(false);
                }}
                className="relative block text-black dark:text-white text-3xl font-light hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer text-center group"
              >
                {label}
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-[1px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            
            {/* Theme Toggle in Mobile Menu */}
            <button
              onClick={() => {
                toggleTheme();
                // Don't close the menu when toggling theme
              }}
              className="relative  text-black dark:text-white text-3xl font-light hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer text-center group flex items-center justify-center gap-2"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            
            {/* Mobile Cart Link */}
            {/* <Link
              href="/cart"
              className="relative text-black dark:text-white text-3xl font-light hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer text-center group flex items-center justify-center gap-2"
              onClick={(e) => {
                setIsOpen(false);
                handleCartClick(e);
              }}
            >
              <div className="relative">
                <svg 
                  className="w-6 h-6" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </Link> */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

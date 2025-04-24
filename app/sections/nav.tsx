"use client"

import React, { useState, useEffect } from 'react'
import { motion, useAnimate, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from 'next/navigation'
import Image from "next/image"

const navItems = [
  {
    label: 'HOME',
    href: '/',
  },
  {
    label: 'SHOP',
    href: '/collection',
  },
  {
    label: 'ABOUT',
    href: '/#about',
    isScroll: true
  },
  {
    label: 'FAQS',
    href: '/#faqs',
    isScroll: true
  },
  {
    label: 'SAY HI',
    href: '/#contact',
    isScroll: true
  },
];

const adminNavItems = [
  {
    label: 'PRODUCTS',
    href: '/products',
  },
  {
    label: 'ORDERS',
    href: '/orders',
  },
  {
    label: 'SETTINGS',
    href: '/settings',
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
      `}</style>
      <div className="w-full bg-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 -ml-10">
              <Link href="/" className="flex flex-col mr-32">
                <Image
                  src="/images/logo-image.jpg"
                  alt="Klean Kuts Logo"
                  width={200}
                  height={48}
                  className="h-12 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map(({ label, href, isScroll }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={(e) => handleNavClick(e, href, isScroll)}
                    className="relative text-black hover:text-red-500 px-3 py-2 text-sm font-light cursor-pointer group"
                  >
                    {label}
                    <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
                {session?.user?.isAdmin && adminNavItems.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="relative text-black hover:text-red-500 px-3 py-2 text-sm font-light cursor-pointer group"
                  >
                    {label}
                    <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth and Cart Section */}
            <div className="hidden md:flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
              ) : session ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-black/70">
                    {session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-black hover:text-red-500 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="text-sm text-black hover:text-red-500 transition-colors"
                >
                  Sign in
                </button>
              )}

              <Link 
                href="/cart" 
                className="relative text-black hover:text-red-500 px-3 py-2 text-sm font-light cursor-pointer group flex items-center gap-2"
                onClick={handleCartClick}
              >
                <div className="relative">
                  <svg 
                    className="w-5 h-5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="relative">
                  Cart
                  <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link>
            </div>

            {/* Mobile Cart and Menu */}
            <div className="md:hidden flex items-center gap-4">
              {status === 'loading' ? (
                <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
              ) : session ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-black/70 truncate max-w-[100px]">
                    {session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-black hover:text-red-500"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="text-sm text-black hover:text-red-500"
                >
                  Sign in
                </button>
              )}

              <Link 
                href="/cart" 
                className="flex items-center justify-center text-black hover:text-red-500 transition-colors"
                onClick={handleCartClick}
              >
                <div className="relative">
                  <svg 
                    className="w-6 h-6" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* Mobile Menu Button */}
              {!isOpen && (
                <button 
                  className="flex items-center justify-center w-6 h-6 relative cursor-pointer"
                  onClick={() => setIsOpen(true)}
                  aria-label="Open Menu"
                >
                  <motion.div
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="7" width="18" height="2" fill="black" />
                      <rect x="3" y="15" width="18" height="2" fill="black" />
                    </svg>
                  </motion.div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className="fixed inset-0 bg-white z-40 overflow-hidden transition-all duration-300"
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
              className="fixed top-5 right-4 z-50 md:hidden flex items-center justify-center w-6 h-6 cursor-pointer text-black"
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
                className="relative block text-black text-3xl font-light hover:text-gray-600 transition-colors cursor-pointer text-center group"
              >
                {label}
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            {/* Mobile Cart Link */}
            <Link
              href="/cart"
              className="relative text-black text-3xl font-light hover:text-gray-600 transition-colors cursor-pointer text-center group flex items-center justify-center gap-2"
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
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

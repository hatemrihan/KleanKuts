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
    // Prevent scrolling when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
    <nav className="fixed top-0 left-0 w-full z-50 bg-white">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/kleankuts-logo.png"
                alt="Klean Kuts Logo"
                width={200}
                height={48}
                className="h-12 w-auto object-contain brightness-0"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between flex-1 pl-8">
            <div className="flex items-center space-x-8">
              {navItems.map(({ label, href, isScroll }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={(e) => handleNavClick(e, href, isScroll)}
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  {label}
                </Link>
              ))}
              {session?.user?.isAdmin && adminNavItems.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-6">
              {status === 'loading' ? (
                <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full" />
              ) : session ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm">{session.user?.name}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-black hover:text-gray-600 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  Sign in
                </button>
              )}

              <Link
                href="/cart"
                className="text-black hover:text-gray-600 transition-colors"
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
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-4">
            {/* Mobile Cart Icon */}
            <Link
              href="/cart"
              className="text-black hover:text-gray-600 transition-colors"
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
            <button
              onClick={() => setIsOpen(true)}
              className="text-black hover:text-gray-600 transition-colors"
              aria-label="Open Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center flex-1 space-y-8">
                {navItems.map(({ label, href, isScroll }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={(e) => {
                      handleNavClick(e, href, isScroll);
                      setIsOpen(false);
                    }}
                    className="text-3xl text-black hover:text-gray-600 transition-colors"
                  >
                    {label}
                  </Link>
                ))}

                {status === 'loading' ? (
                  <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full" />
                ) : session ? (
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-xl">{session.user?.name}</span>
                    <button
                      onClick={() => signOut()}
                      className="text-xl text-black hover:text-gray-600 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => signIn('google')}
                    className="text-xl text-black hover:text-gray-600 transition-colors"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Nav;

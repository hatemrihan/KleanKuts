"use client"

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap';

const productImages = [
  '/images/try-image.jpg',
  '/images/try-image.jpg',
  '/images/try-image.jpg',
];

const NewHeader = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const sliderContainerRef = useRef(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageContainerRef = useRef(null);
  
  useEffect(() => {
    // Initialize GSAP animations after the component mounts
    setIsLoaded(true);
    
    // Apply initial animations
    if (slideRefs.current.length > 0) {
      // Animate in the slides
      gsap.to(slideRefs.current, {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        duration: 0.8,
        stagger: 0.2,
        delay: 0.5,
      });
    }
    
    // Add mouse move effect for desktop layout
    const container = imageContainerRef.current;
    let timer: NodeJS.Timeout;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      
      clearTimeout(timer);
      const xPos = (e.clientX - window.innerWidth / 2) * 0.05;
      
      gsap.to(container, {
        x: xPos,
        rotation: xPos > 0 ? 2 : xPos < 0 ? -2 : 0,
        duration: 1,
        ease: 'power2.out'
      });
      
      timer = setTimeout(() => {
        gsap.to(container, {
          rotation: 0,
          duration: 0.5,
          ease: 'power2.out'
        });
      }, 300);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen  dark:bg-black flex flex-col justify-center items-center overflow-hidden">
      {/* Mobile Layout */}
      <div className="block lg:hidden w-full max-w-2xl mx-auto px-4 py-10">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-xl font-light text-center tracking-widest text-black dark:text-white">OUR NEW COLLECTION</h2>
        </div>
       
        <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-6 leading-tight">
          The Silent Elite 
<br />Eleve Tee
        </h1>
        {/* Horizontal Scrollable Images with Animation */}
        <div 
          ref={sliderContainerRef}
          className="flex overflow-x-auto gap-4 scrollable-x pb-2"
        >
          {productImages.map((img, idx) => (
            <div
              key={idx}
              ref={el => { slideRefs.current[idx] = el; }}
              className="relative flex-shrink-0 w-48 h-64 bg-white dark:bg-black overflow-hidden group"
              style={{ 
                minWidth: '12rem', 
                minHeight: '16rem',
                clipPath: isLoaded ? undefined : 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'
              }}
              onClick={() => setCurrentImage(idx)}
            >
              <Image
                src={img}
                alt={`Product ${idx + 1}`}
                fill
                className="object-contain transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={idx === 0}
                onError={(e) => {
                  console.error('Error loading image:', e);
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center  dark:bg-black/80 opacity-0 transition-opacity duration-300 hover:opacity-100 group-hover:opacity-100">
                <h6 className="text-sm font-medium text-black dark:text-white">ZOHO Collection</h6>
                <span className="text-xs text-black/70 dark:text-white/70">Oversized Style</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Explore Button - Mobile */}
        <div className="mt-10 flex justify-center">
          <Link 
            href="/collection" 
            className="px-8 py-3 border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300 tracking-widest text-sm font-medium"
          >
            EXPLORE
          </Link>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Left Column: Title and Description */}
          <div className="col-span-1">
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="text-xl font-light tracking-widest text-black dark:text-white">FEATURED PRODUCT</h2>
            </div>
            
            <h1 className="text-5xl font-bold text-black dark:text-white mb-6 leading-tight">
              ZOHO —<br />OVERSIZE SWEATSHIRT
            </h1>
            <p className="text-black/70 dark:text-white/70 mb-8">
              Elevate your wardrobe with our premium oversized sweatshirt. Crafted from high-quality materials for ultimate comfort and style.
            </p>
            
            {/* Explore Button - Desktop */}
            <div className="mt-10">
              <Link 
                href="/collection" 
                className="px-8 py-3 border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300 tracking-widest text-sm font-medium"
              >
                EXPLORE
              </Link>
            </div>
          </div>
          
          {/* Middle Column: Main Image with Interactive Animation */}
          <div className="col-span-1 flex justify-center">
            <div 
              ref={imageContainerRef}
              className="relative w-full aspect-[3/4] max-w-sm group"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Image
                src={productImages[currentImage]}
                alt="Featured Product"
                fill
                className="object-contain transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 33vw"
                priority
                onError={(e) => {
                  console.error('Error loading image:', e);
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <h6 className="text-lg font-medium text-black dark:text-white">ZOHO Collection</h6>
                <span className="text-base text-black/70 dark:text-white/70">Premium Oversized Style</span>
              </div>
            </div>
          </div>
          
          {/* Right Column: Thumbnail Images with Animation */}
          <div className="col-span-1 flex flex-col gap-4 items-center">
            {productImages.map((img, idx) => (
              <div
                key={idx}
                ref={el => { slideRefs.current[idx + productImages.length] = el; }}
                className={`relative w-24 h-32 cursor-pointer transition-all duration-300 overflow-hidden group ${
                  currentImage === idx ? 'border-2 border-black dark:border-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ 
                  clipPath: isLoaded ? undefined : 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'
                }}
                onClick={() => setCurrentImage(idx)}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-contain transition-transform duration-300 hover:scale-105"
                  sizes="96px"
                  onError={(e) => {
                    console.error('Error loading image:', e);
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/0 opacity-0 transition-opacity duration-300 hover:opacity-100">
                  <h6 className="text-xs font-medium text-black dark:text-white">ZOHO</h6>
                  <span className="text-xs text-black/70 dark:text-white/70">Style</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewHeader
"use client"

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap';
import { motion, useInView } from 'framer-motion';

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
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.1,
        duration: 0.6
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };
  
  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };
  
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
    <div 
      ref={containerRef}
      className="relative w-full min-h-screen dark:bg-black flex flex-col justify-center items-center overflow-hidden"
    >
      {/* Mobile Layout */}
      <motion.div 
        className="block lg:hidden w-full max-w-2xl mx-auto px-4 py-10"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Section Header */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <h2 className="text-xl font-light text-center tracking-widest text-black dark:text-white">OUR NEW COLLECTION</h2>
        </motion.div>
       
        <motion.h1 
          className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-6 leading-tight"
          variants={itemVariants}
        >
          The Silent Elite 
<br />Eleve Tee
        </motion.h1>
        
        {/* Horizontal Scrollable Images with Animation */}
        <motion.div 
          ref={sliderContainerRef}
          className="flex overflow-x-auto gap-4 scrollable-x pb-2"
          variants={containerVariants}
        >
          {productImages.map((img, idx) => (
            <motion.div
              key={idx}
              ref={el => { slideRefs.current[idx] = el; }}
              className="relative flex-shrink-0 w-48 h-64 bg-white dark:bg-black overflow-hidden group"
              style={{ 
                minWidth: '12rem', 
                minHeight: '16rem',
                clipPath: isLoaded ? undefined : 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'
              }}
              onClick={() => setCurrentImage(idx)}
              variants={imageVariants}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center dark:bg-black/80 opacity-0 transition-opacity duration-300 hover:opacity-100 group-hover:opacity-100">
                <h6 className="text-sm font-medium text-black dark:text-white">ZOHO Collection</h6>
                <span className="text-xs text-black/70 dark:text-white/70">Oversized Style</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Explore Button - Mobile */}
        <motion.div 
          className="mt-10 flex justify-center"
          variants={itemVariants}
        >
          <Link 
            href="/collection" 
            className="px-8 py-3 border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300 tracking-widest text-sm font-medium"
          >
            EXPLORE
          </Link>
        </motion.div>
      </motion.div>
      
      {/* Desktop Layout */}
      <motion.div 
        className="hidden lg:flex w-full max-w-7xl mx-auto px-4 py-10"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Left Column: Title and Description */}
          <motion.div 
            className="col-span-1"
            variants={itemVariants}
          >
            {/* Section Header */}
            <motion.div 
              className="mb-8"
              variants={itemVariants}
            >
              <h2 className="text-xl font-light tracking-widest text-black dark:text-white">FEATURED PRODUCT</h2>
            </motion.div>
            
            <motion.h1 
              className="text-5xl font-bold text-black dark:text-white mb-6 leading-tight"
              variants={itemVariants}
            >
              ZOHO —<br />OVERSIZE SWEATSHIRT
            </motion.h1>
            
            <motion.p 
              className="text-black/70 dark:text-white/70 mb-8"
              variants={itemVariants}
            >
              Elevate your wardrobe with our premium oversized sweatshirt. Crafted from high-quality materials for ultimate comfort and style.
            </motion.p>
            
            {/* Explore Button - Desktop */}
            <motion.div 
              className="mt-10"
              variants={itemVariants}
            >
              <Link 
                href="/collection" 
                className="px-8 py-3 border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300 tracking-widest text-sm font-medium"
              >
                EXPLORE
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Middle Column: Main Image with Interactive Animation */}
          <motion.div 
            className="col-span-1 flex justify-center"
            variants={imageVariants}
          >
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
          </motion.div>
          
          {/* Right Column: Thumbnail Images with Animation */}
          <motion.div 
            className="col-span-1 flex flex-col gap-4 items-center"
            variants={containerVariants}
          >
            {productImages.map((img, idx) => (
              <motion.div
                key={idx}
                ref={el => { slideRefs.current[idx + productImages.length] = el; }}
                className={`relative w-24 h-32 cursor-pointer transition-all duration-300 overflow-hidden group ${
                  currentImage === idx ? 'border-2 border-black dark:border-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ 
                  clipPath: isLoaded ? undefined : 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'
                }}
                onClick={() => setCurrentImage(idx)}
                variants={imageVariants}
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default NewHeader
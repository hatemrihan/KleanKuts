'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

interface CategoryItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  link: string;
}

interface CategoryDisplayProps {
  categories: CategoryItem[];
  heading?: string;
  subheading?: string;
}

const CategoryDisplay: React.FC<CategoryDisplayProps> = ({ 
  categories, 
  heading = "Categories", 
  subheading = "Explore our collections" 
}) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section 
      ref={containerRef}
      className="w-full py-16 px-4 md:px-8 bg-white dark:bg-black"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-light tracking-widest text-black dark:text-white mb-3"
            variants={itemVariants}
          >
            {heading.toUpperCase()}
          </motion.h2>
          
          {subheading && (
            <motion.p 
              className="text-black/60 dark:text-white/60 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              {subheading}
            </motion.p>
          )}
        </motion.div>

        {/* Categories Display */}
        <motion.div 
          className="space-y-16"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              variants={itemVariants}
            >
              {/* Text Content - Always on left for desktop */}
              <div className="flex flex-col justify-center order-2 lg:order-1">
                <h3 className="text-3xl font-light text-black dark:text-white mb-2">
                  {category.title}
                </h3>
                
                {category.subtitle && (
                  <h4 className="text-xl font-light text-black/80 dark:text-white/80 mb-4">
                    {category.subtitle}
                  </h4>
                )}
                
                <p className="text-black/70 dark:text-white/70 mb-6">
                  {category.description}
                </p>

                {/* Desktop Button - Only visible on desktop */}
                <div className="hidden lg:block">
                  <Link 
                    href={category.link} 
                    className="inline-block px-6 py-2 border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300 tracking-widest text-sm font-light"
                  >
                    EXPLORE
                  </Link>
                </div>
              </div>
              
              {/* Image Container - Always on right for desktop */}
              <div className="relative h-[500px] order-1 lg:order-2">
                <Image 
                  src={category.imageUrl} 
                  alt={category.title}
                  fill
                  className="object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                  priority={index < 3}
                />
                
                {/* Mobile Button - Centered on the image, only visible on mobile */}
                <div className="absolute inset-0 flex items-center justify-center lg:hidden">
                  <Link 
                    href={category.link} 
                    className="px-6 py-22 border border-white text-white bg-black/30 backdrop-blur-sm hover:bg-white hover:text-black transition-colors duration-300 tracking-widest text-sm font-light"
                  >
                    EXPLORE
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CategoryDisplay; 
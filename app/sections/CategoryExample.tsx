'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

// This is a standalone example component showing the improved category display

const CategoryExample = () => {
  // Sample categories data - in a real implementation this would come from an API
  const sampleCategories = [
    {
      id: '1',
      title: 'Serenity',
      subtitle: 'The Ultimate Retreat',
      description: 'A sophisticated getaway with modern architecture and unforgettable sunsets, where every moment feels timeless. Tucked among towering peaks and serene valleys, this haven offers a peaceful escape from the noise of the world.',
      imageUrl: '/images/try-image.jpg',
      link: '/collection/serenity'
    },
    {
      id: '2',
      title: 'Aurora',
      subtitle: 'Celestial Collection',
      description: 'A sanctuary above the clouds, offering celestial views and unmatched tranquility for dreamers and stargazers alike. Nestled in the heart of nature, this retreat is the perfect place to watch the northern lights dance across the sky.',
      imageUrl: '/images/try-image.jpg',
      link: '/collection/aurora'
    },
    {
      id: '3',
      title: 'Golden Shore',
      subtitle: 'Summer Essentials',
      description: 'Feel the warmth of the sun and the embrace of golden shores, where luxury meets the serenity of the sea. Our summer collection captures the essence of seaside tranquility with lightweight, breathable fabrics.',
      imageUrl: '/images/try-image.jpg',
      link: '/collection/golden-shore'
    },
    {
      id: '4',
      title: 'Mountain Vista',
      subtitle: 'Elevated Style',
      description: 'Inspired by the majesty of mountain landscapes, this collection blends rugged durability with sophisticated style. Perfect for both urban environments and wilderness adventures.',
      imageUrl: '/images/try-image.jpg',
      link: '/collection/mountain-vista'
    },
    {
      id: '5',
      title: 'Urban Nomad',
      subtitle: 'City Life Collection',
      description: 'For those constantly on the move in urban landscapes. Versatile pieces that transition seamlessly from day to night, designed for the modern explorer navigating city streets.',
      imageUrl: '/images/try-image.jpg',
      link: '/collection/urban-nomad'
    },
    {
      id: '6',
      title: 'Midnight Azure',
      subtitle: 'Evening Elegance',
      description: 'Elegant evening wear inspired by the depth and mystery of the night sky. Luxurious fabrics and sophisticated silhouettes for special occasions and midnight soirées.',
      imageUrl: '/images/try-image.jpg',
      link: '/collection/midnight-azure'
    }
  ];

  return (
    <section className="w-full py-16 px-4 md:px-8 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-light tracking-widest text-black dark:text-white mb-3">
            DISCOVER OUR COLLECTIONS
          </h2>
          <p className="text-black/60 dark:text-white/60 max-w-2xl mx-auto">
            Explore curated designs that blend timeless elegance with contemporary style
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-12">
          {sampleCategories.map((category, index) => (
            <CategoryCard 
              key={category.id}
              category={category}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Individual category card component
interface Category {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  link: string;
}

interface CategoryCardProps {
  category: Category;
  index: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, index }) => {
  const cardRef = React.useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.2 });

  // Animation variants for the card
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="group relative overflow-hidden"
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Text Content - Always on left for desktop */}
        <div className="flex flex-col justify-center order-2 lg:order-1">
          <h3 className="text-5xl font-bold text-black dark:text-white mb-2">
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
      </div>
    </motion.div>
  );
};

export default CategoryExample; 
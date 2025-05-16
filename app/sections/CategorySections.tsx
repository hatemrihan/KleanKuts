"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// Type definitions for the category data from our new model
interface CallToAction {
  text: string;
  link: string;
}

interface CustomStyles {
  textColor?: string;
  backgroundColor?: string;
  overlayOpacity?: number;
}

interface DesktopLayout {
  imagePosition?: 'left' | 'right' | 'center';
  textAlignment?: 'left' | 'right' | 'center';
  description?: string;
}

interface MobileLayout {
  imagePosition?: 'top' | 'bottom' | 'center';
  textAlignment?: 'left' | 'right' | 'center';
  description?: string;
}

interface CategoryImages {
  main?: string;
  mobile?: string;
  gallery?: string[];
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  headline?: string;
  subheadline?: string;
  displayOrder: number;
  isActive: boolean;
  parentId?: string;
  buttonText?: string;
  buttonLink?: string;
  desktopLayout?: DesktopLayout;
  mobileLayout?: MobileLayout;
  images?: CategoryImages;
  customStyles?: CustomStyles;
  callToAction?: CallToAction;
}

const CategorySections = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Use environment variable for base URL
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
        
        // Use the dedicated endpoint for active categories
        const response = await fetch(`${API_URL}/storefront/categories`);
        
        // Improved error handling with logging
        if (!response.ok) {
          console.error('Categories API error:', response.status, response.statusText);
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received categories:', data.length);
        
        // Sort by displayOrder
        const sortedCategories = data.sort((a: Category, b: Category) => a.displayOrder - b.displayOrder);
        
        setCategories(sortedCategories);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load homepage sections');
        // Use empty array as fallback
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-500">Loading sections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {categories.map((category) => (
        <CategorySection key={category._id} category={category} />
      ))}
    </div>
  );
};

// Component for rendering an individual category section
const CategorySection = ({ category }: { category: Category }) => {
  // Get the appropriate image based on viewport
  const [isMobile, setIsMobile] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  
  // Prep gallery images
  const galleryImages = [];
  
  // Add main image as first gallery item
  if (category.images?.main) {
    galleryImages.push(category.images.main);
  }
  
  // Add additional gallery images if available
  if (category.images?.gallery && Array.isArray(category.images.gallery)) {
    galleryImages.push(...category.images.gallery);
  }
  
  // If no images, use a placeholder
  if (galleryImages.length === 0) {
    galleryImages.push('/images/try-image.jpg');
  }
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024); // 1024px is our lg breakpoint
      };
      
      // Set initial value
      checkMobile();
      
      // Add listener for window resize
      window.addEventListener('resize', checkMobile);
      
      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, []);
  
  // Get layout information
  const desktopLayout = category.desktopLayout || { imagePosition: 'right', textAlignment: 'left' };
  const mobileLayout = category.mobileLayout || { imagePosition: 'top', textAlignment: 'center' };
  
  // Default background and text styles
  const backgroundStyle = {
    backgroundColor: category.customStyles?.backgroundColor || 'transparent',
  };
  
  const textStyle = {
    color: category.customStyles?.textColor || 'inherit',
  };
  
  const overlayStyle = {
    backgroundColor: 'black',
    opacity: category.customStyles?.overlayOpacity || 0.3,
  };
  
  // Select image based on device type
  const mainImageUrl = isMobile && category.images?.mobile
    ? category.images.mobile
    : (galleryImages[currentImage] || '/images/try-image.jpg');
  
  // Handle text alignment classes
  const getTextAlignClass = (alignment: 'left' | 'right' | 'center' | undefined) => {
    switch (alignment) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center': return 'text-center';
      default: return isMobile ? 'text-center' : 'text-left';
    }
  };
  
  // Get desktop layout column classes
  const getDesktopLayoutClasses = () => {
    switch (desktopLayout.imagePosition) {
      case 'left':
        return {
          contentClass: 'col-span-1 order-2',
          imageClass: 'col-span-1 order-1'
        };
      case 'center':
        return {
          contentClass: 'col-span-2 text-center',
          imageClass: 'col-span-2' // In center mode, image is background
        };
      case 'right':
      default:
        return {
          contentClass: 'col-span-1 order-1',
          imageClass: 'col-span-1 order-2'
        };
    }
  };
  
  const desktopClasses = getDesktopLayoutClasses();
  const desktopTextAlignClass = getTextAlignClass(desktopLayout.textAlignment);
  const mobileTextAlignClass = getTextAlignClass(mobileLayout.textAlignment);
  
  // Get description based on viewport
  const description = isMobile 
    ? (category.mobileLayout?.description || category.description)
    : (category.desktopLayout?.description || category.description);
  
  // Button text & link
  const buttonText = category.buttonText || category.callToAction?.text || 'EXPLORE';
  const buttonLink = category.buttonLink || category.callToAction?.link || `/category/${category.slug}`;
  
  return (
    <div 
      className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden"
      style={backgroundStyle}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          <Image
            src={mainImageUrl}
            alt={category.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0" style={overlayStyle}></div>
        </div>
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-20 lg:py-32">
        {/* Mobile Layout */}
        <div className={`block lg:hidden w-full max-w-2xl mx-auto ${mobileTextAlignClass}`}>
          {category.subheadline && (
            <h3 className="text-sm sm:text-base uppercase tracking-widest font-light mb-3" style={textStyle}>
              {category.subheadline}
            </h3>
          )}
          
          {category.headline && (
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={textStyle}>
              {category.headline}
            </h2>
          )}
          
          {description && (
            <p className="text-base sm:text-lg mb-8 opacity-90" style={textStyle}>
              {description}
            </p>
          )}
          
          {/* Gallery dots for mobile - only show if we have multiple images */}
          {galleryImages.length > 1 && (
            <div className="flex justify-center space-x-2 my-6">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${currentImage === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}
          
          <div className="mt-8 flex justify-center">
            <Link 
              href={buttonLink} 
              className="px-8 py-3 border border-current text-current hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors duration-300 tracking-widest text-sm font-medium"
            >
              {buttonText}
            </Link>
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden lg:block w-full">
          <div className="grid grid-cols-2 gap-8 items-center">
            {/* Content Column */}
            <div className={`${desktopClasses.contentClass} ${desktopTextAlignClass}`}>
              {category.subheadline && (
                <h3 className="text-lg uppercase tracking-widest font-light mb-3" style={textStyle}>
                  {category.subheadline}
                </h3>
              )}
              
              {category.headline && (
                <h2 className="text-4xl font-bold mb-6" style={textStyle}>
                  {category.headline}
                </h2>
              )}
              
              {description && (
                <p className="text-lg opacity-90 mb-8 max-w-xl" style={textStyle}>
                  {description}
                </p>
              )}
              
              {/* Gallery dots for desktop - only show if we have multiple images and not in center mode */}
              {galleryImages.length > 1 && desktopLayout.imagePosition !== 'center' && (
                <div className={`flex ${desktopTextAlignClass === 'text-center' ? 'justify-center' : desktopTextAlignClass === 'text-right' ? 'justify-end' : 'justify-start'} space-x-2 my-6`}>
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`w-3 h-3 rounded-full transition-all ${currentImage === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
                      aria-label={`View image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
              
              <div className={`mt-8 ${desktopTextAlignClass === 'text-center' ? 'flex justify-center' : ''}`}>
                <Link 
                  href={buttonLink} 
                  className="px-8 py-3 border border-current text-current hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors duration-300 tracking-widest text-sm font-medium inline-block"
                >
                  {buttonText}
                </Link>
              </div>
            </div>
            
            {/* Image Column - only show if not center layout */}
            {desktopLayout.imagePosition !== 'center' && (
              <div className={`${desktopClasses.imageClass} relative`}>
                {galleryImages.length > 0 && (
                  <div className="relative aspect-[3/4] w-full max-w-lg mx-auto overflow-hidden">
                    <Image
                      src={galleryImages[currentImage]}
                      alt={`${category.name} - Image ${currentImage + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Gallery dots for desktop center layout - only show if we have multiple images */}
          {galleryImages.length > 1 && desktopLayout.imagePosition === 'center' && (
            <div className="flex justify-center space-x-2 mt-8">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${currentImage === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySections; 
"use client"

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { processImageUrl } from '../utils/imageUtils'
import { motion, useInView } from 'framer-motion'

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

interface DiagnosticInfo {
  timestamp: string;
  adminUrl: string;
  responseStatus: number | null;
  responseTime: string | null;
  responseLength: number | string | null;
  corsHeaders: Record<string, string | null> | null;
  error: string | null;
}

interface ApiResponse {
  categories: Category[];
  diagnostic: DiagnosticInfo;
  message: string;
}

// Update the FALLBACK_CATEGORIES to include better descriptions
const FALLBACK_CATEGORIES: Category[] = [
  {
    _id: 'fallback1',
    name: 'Serenity Collection',
    slug: 'serenity-collection',
    headline: 'SERENITY',
    subheadline: 'The Ultimate Retreat',
    description: 'A sophisticated getaway with modern architecture and unforgettable sunsets, where every moment feels timeless. Tucked among towering peaks and serene valleys, this haven offers a peaceful escape from the noise of the world.',
    displayOrder: 1,
    isActive: true,
    images: {
      main: '/images/try-image.jpg',
      mobile: '/images/try-image.jpg',
      gallery: ['/images/try-image.jpg']
    },
    desktopLayout: {
      imagePosition: 'right',
      textAlignment: 'left'
    },
    mobileLayout: {
      imagePosition: 'top',
      textAlignment: 'center'
    },
    buttonText: 'EXPLORE'
  },
  {
    _id: 'fallback2',
    name: 'Aurora Collection',
    slug: 'aurora-collection',
    headline: 'AURORA',
    subheadline: 'Celestial Collection',
    description: 'A sanctuary above the clouds, offering celestial views and unmatched tranquility for dreamers and stargazers alike. Nestled in the heart of nature, this retreat is the perfect place to watch the northern lights dance across the sky.',
    displayOrder: 2,
    isActive: true,
    images: {
      main: '/images/try-image.jpg',
      mobile: '/images/try-image.jpg',
      gallery: ['/images/try-image.jpg']
    },
    desktopLayout: {
      imagePosition: 'left',
      textAlignment: 'right'
    },
    mobileLayout: {
      imagePosition: 'top',
      textAlignment: 'center'
    },
    buttonText: 'DISCOVER'
  },
  {
    _id: 'fallback3',
    name: 'Golden Shore',
    slug: 'golden-shore',
    headline: 'GOLDEN SHORE',
    subheadline: 'Summer Essentials',
    description: 'Feel the warmth of the sun and the embrace of golden shores, where luxury meets the serenity of the sea. Our summer collection captures the essence of seaside tranquility with lightweight, breathable fabrics.',
    displayOrder: 3,
    isActive: true,
    images: {
      main: '/images/try-image.jpg',
      mobile: '/images/try-image.jpg',
      gallery: ['/images/try-image.jpg']
    },
    desktopLayout: {
      imagePosition: 'right',
      textAlignment: 'left'
    },
    mobileLayout: {
      imagePosition: 'top',
      textAlignment: 'center'
    },
    buttonText: 'SHOP NOW'
  }
];

const CategorySections = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching categories via proxy API...');
        
        const response = await fetch('/api/admin-categories', {
          method: 'GET',
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.error('API response not OK:', {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Parse the response which now includes categories and diagnostic info
        const data: ApiResponse = await response.json();
        console.log('API Response:', data);
        
        // Store diagnostic information
        if (data.diagnostic) {
          setDiagnostic(data.diagnostic);
          console.log('Diagnostic info:', data.diagnostic);
        }
        
        // Extract categories from the response
        const receivedCategories = data.categories || [];
        console.log(`Received ${receivedCategories.length} categories`);
        
        // If there's a message, log it
        if (data.message) {
          console.log('API Message:', data.message);
        }
        
        if (receivedCategories.length === 0) {
          console.warn('No categories received from API');
          setError('No categories available');
          setCategories([]);
          return;
        }
        
        // Log the first category for debugging
        if (receivedCategories.length > 0) {
          const firstCategory = receivedCategories[0];
          console.log('First category sample:', {
            id: firstCategory._id,
            name: firstCategory.name,
            headline: firstCategory.headline,
            isActive: firstCategory.isActive,
            hasImages: !!firstCategory.images,
            mainImage: firstCategory.images?.main
          });
        }
        
        // Filter for active categories and sort by display order
        const activeCategories = receivedCategories
          .filter(cat => cat.isActive)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        console.log(`Active categories: ${activeCategories.length}`);
        setCategories(activeCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(`Failed to load homepage sections: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    // Enhanced error display with diagnostic info
    return (
      <div className="h-96 flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4 text-center font-bold">{error}</div>
        
        <div className="text-sm text-gray-500 mb-6 max-w-md text-center">
          There seems to be an issue with the connection to the admin panel.
        </div>
        
        {diagnostic && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono max-w-md w-full">
            <p>Admin URL: {diagnostic.adminUrl}</p>
            <p>Response Status: {diagnostic.responseStatus}</p>
            <p>Response Time: {diagnostic.responseTime}</p>
            <p>Categories: {diagnostic.responseLength}</p>
            {diagnostic.error && <p className="text-red-500">Error: {diagnostic.error}</p>}
          </div>
        )}
        
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Retry Connection
          </button>
          
          <button
            onClick={() => window.open('https://eleveadmin.netlify.app', '_blank')}
            className="px-4 py-2 border border-black text-black rounded hover:bg-gray-100 transition-colors"
          >
            Open Admin Panel
          </button>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <div className="text-gray-500 mb-4">No categories have been created in the admin panel yet.</div>
        
        {diagnostic && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono max-w-md w-full">
            <p>Categories from API: {diagnostic.responseLength}</p>
            <p>Admin API status: {diagnostic.responseStatus === 200 ? 'OK' : diagnostic.responseStatus}</p>
            <p>CORS Header: {diagnostic.corsHeaders?.['access-control-allow-origin'] || 'None'}</p>
          </div>
        )}
        
        <button
          onClick={() => window.open('https://eleveadmin.netlify.app/dashboard/categories', '_blank')}
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Create Categories
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-black">
      {categories && categories.length > 0 ? (
        categories.map(category => (
          <CategorySection key={category._id} category={category} />
        ))
      ) : (
        // Show fallback categories if no categories from API
        FALLBACK_CATEGORIES.map(category => (
          <CategorySection key={category._id} category={category} />
        ))
      )}
    </div>
  );
};

// Update the CategorySection component with enhanced design
const CategorySection = ({ category }: { category: Category }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };
  
  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        delay: 0.3,
        ease: [0.22, 1, 0.36, 1] 
      }
    }
  };

  const processImages = () => {
    try {
      // First try to get gallery images
      if (category.images?.gallery && Array.isArray(category.images.gallery) && category.images.gallery.length > 0) {
        return category.images.gallery.map(img => processImageUrl(img));
      }
      
      // If no gallery, use main image
      if (category.images?.main) {
        return [processImageUrl(category.images.main)];
      }
      
      // Fallback
      return ['/images/try-image.jpg'];
    } catch (err) {
      console.error('Error processing category images:', err);
      return ['/images/try-image.jpg'];
    }
  };
  
  const categoryImages = processImages();
  
  // Get the appropriate image based on viewport
  const [isMobile, setIsMobile] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, []);
  
  // Layout and style setup
  const desktopLayout = category.desktopLayout || { imagePosition: 'right', textAlignment: 'left' };
  const mobileLayout = category.mobileLayout || { imagePosition: 'top', textAlignment: 'center' };
  
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
  
  // Get the image source with fallbacks
  const getMainImageSrc = () => {
    try {
      if (isMobile && category.images?.mobile) {
        return processImageUrl(category.images.mobile);
      }
      
      return categoryImages[currentImage] || '/images/try-image.jpg';
    } catch (err) {
      console.error('Error getting main image source:', err);
      return '/images/try-image.jpg';
    }
  };
  
  const mainImageSrc = getMainImageSrc();
  
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
    <motion.section 
      ref={sectionRef}
      className="w-full relative overflow-hidden min-h-[600px] md:min-h-[700px] bg-white dark:bg-black"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {/* Image Background (full width/height) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src={getMainImageSrc()}
          alt={category.name}
          fill
          className="object-cover object-center transition-all duration-700 hover:scale-[1.02]"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-80" />
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 py-20 h-full flex flex-col justify-center">
        <motion.div 
          className={`max-w-xl ${getTextAlignClass(category.desktopLayout?.textAlignment)}`}
          variants={textVariants}
        >
          {/* Headline/Title */}
          {category.headline && (
            <h2 className="text-sm md:text-base text-white/80 uppercase tracking-widest mb-2">
              {category.headline}
            </h2>
          )}
          
          {/* Main Title */}
          <h3 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-4">
            {category.name}
          </h3>
          
          {/* Subheading */}
          {category.subheadline && (
            <h4 className="text-xl md:text-2xl font-light text-white/90 mb-6">
              {category.subheadline}
            </h4>
          )}
          
          {/* Description */}
          {category.description && (
            <p className="text-white/80 mb-8 max-w-prose text-sm md:text-base">
              {category.description}
            </p>
          )}
          
          {/* Button/Call to Action */}
          {(category.buttonText || category.callToAction?.text) && (
            <Link 
              href={category.buttonLink || category.callToAction?.link || `/${category.slug}`} 
              className="inline-block px-8 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors duration-300 tracking-widest text-sm"
            >
              {category.buttonText || category.callToAction?.text || 'EXPLORE'}
            </Link>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CategorySections; 
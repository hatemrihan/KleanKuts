'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the FacebookPixel component with SSR disabled
const FacebookPixelWithNoSSR = dynamic(
  () => import('./FacebookPixel'),
  { ssr: false }
);

const FacebookPixelManager = () => {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPixelConfig = async () => {
      try {
        // First try to get cached pixel ID to avoid unnecessary API calls
        const cachedPixelId = localStorage.getItem('fb_pixel_id');
        const cachedTimestamp = localStorage.getItem('fb_pixel_timestamp');
        
        // Use cache if it's less than 1 hour old
        if (cachedPixelId && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp);
          if (Date.now() - timestamp < 3600000) { // 1 hour in milliseconds
            console.log('Using cached pixel ID');
            setPixelId(cachedPixelId);
            setIsEnabled(true);
            setIsLoading(false);
            return;
          }
        }
        
        // Try environment variable
        const envPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
        if (envPixelId) {
          console.log('Using pixel ID from environment variable');
          setPixelId(envPixelId);
          setIsEnabled(true);
          
          // Cache the pixel ID
          localStorage.setItem('fb_pixel_id', envPixelId);
          localStorage.setItem('fb_pixel_timestamp', Date.now().toString());
        }
        // Skip the direct API call to avoid CORS errors
      } finally {
        setIsLoading(false);
      }
    };

    fetchPixelConfig();
  }, []);

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // If pixel is disabled or no ID is available, don't render the pixel
  if (!isEnabled || !pixelId) {
    return null;
  }

  return <FacebookPixelWithNoSSR pixelId={pixelId} />;
};

export default FacebookPixelManager; 
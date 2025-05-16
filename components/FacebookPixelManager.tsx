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
        // First try to load from admin panel
        const response = await fetch('https://eleveadmin.netlify.app/api/settings/pixel', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://elevee.netlify.app'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Received pixel config from admin:', data);
          
          if (data.pixelId && data.isEnabled) {
            setPixelId(data.pixelId);
            setIsEnabled(true);
          }
        } else {
          // If admin API fails, try fallback sources
          console.log('Admin API not available, using fallbacks');
          throw new Error('Admin API not available');
        }
      } catch (err) {
        console.log('Error fetching pixel config:', err);
        
        // Try environment variable
        const envPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
        if (envPixelId) {
          console.log('Using pixel ID from environment variable');
          setPixelId(envPixelId);
          setIsEnabled(true);
        } 
        // Try localStorage as last resort (for testing)
        else if (typeof window !== 'undefined') {
          const localPixelId = localStorage.getItem('fb_pixel_id');
          if (localPixelId) {
            console.log('Using pixel ID from localStorage');
            setPixelId(localPixelId);
            setIsEnabled(true);
          }
        }
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
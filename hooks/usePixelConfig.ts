'use client';

import { useState, useEffect } from 'react';

interface PixelConfig {
  pixelId: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePixelConfig(): PixelConfig {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPixelConfig = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the pixel configuration from the admin API
        const response = await fetch('https://eleveadmin.netlify.app/api/settings/pixel', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://elevee.netlify.app'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch pixel configuration');
        }

        const data = await response.json();
        
        // Check if we have a valid pixel ID and it's enabled
        if (data.pixelId && data.isEnabled) {
          setPixelId(data.pixelId);
          console.log('Facebook Pixel configured with ID:', data.pixelId);
        } else {
          console.log('Facebook Pixel is disabled or missing ID');
          setPixelId(null);
        }
      } catch (err) {
        console.error('Error fetching pixel configuration:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Fallback to local storage or environment variable if available
        const fallbackId = localStorage.getItem('fb_pixel_id') || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
        if (fallbackId) {
          console.log('Using fallback pixel ID from local storage or env var');
          setPixelId(fallbackId);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPixelConfig();
  }, []);

  return { pixelId, isLoading, error };
}

export default usePixelConfig; 
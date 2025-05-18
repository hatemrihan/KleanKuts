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
        
        // Try to get cached pixel ID first to avoid unnecessary API calls
        const cachedPixelId = localStorage.getItem('fb_pixel_id');
        const cachedTimestamp = localStorage.getItem('fb_pixel_timestamp');
        
        // Use cache if it's less than 1 hour old
        if (cachedPixelId && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp);
          if (Date.now() - timestamp < 3600000) { // 1 hour in milliseconds
            console.log('Using cached pixel ID');
            setPixelId(cachedPixelId);
            setIsLoading(false);
            return;
          }
        }
        
        // Use environment variable if available
        const envPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
        if (envPixelId) {
          console.log('Using pixel ID from environment variable');
          setPixelId(envPixelId);
          localStorage.setItem('fb_pixel_id', envPixelId);
          localStorage.setItem('fb_pixel_timestamp', Date.now().toString());
          setIsLoading(false);
          return;
        }
        
        // Skip the direct API call to avoid CORS error
        // The admin should provide pixel ID through environment variables instead
        console.log('Skipping API call to avoid CORS issues, using fallbacks only');
        setPixelId(null);
      } catch (err) {
        console.error('Error configuring pixel:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Fallback to environment variable as last resort
        const fallbackId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
        if (fallbackId) {
          console.log('Using fallback pixel ID from env var');
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
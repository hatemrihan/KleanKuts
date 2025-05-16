'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

interface FacebookPixelProps {
  pixelId: string;
}

const FacebookPixel = ({ pixelId }: FacebookPixelProps) => {
  useEffect(() => {
    // Check if the pixel ID is provided
    if (!pixelId) return;

    // Only initialize the Facebook Pixel once
    if (window.fbq) return;

    // Initialize Facebook Pixel
    const fbq = function() {
      // @ts-ignore
      window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
    };
    
    window.fbq = window.fbq || fbq;
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window.fbq.queue = [];
    
    // Load the Facebook Pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    
    // Initialize the pixel with the provided ID
    window.fbq('init', pixelId);
    
    // Track PageView event on each route change
    window.fbq('track', 'PageView');
    
    // Clean up on unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [pixelId]);

  // Add the noscript fallback for users with JavaScript disabled
  if (typeof window !== 'undefined' && pixelId) {
    return (
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }} 
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`} 
          alt="" 
        />
      </noscript>
    );
  }

  return null;
};

export default FacebookPixel; 
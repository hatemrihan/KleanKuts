'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SiteStatusRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check for waitlist page and API routes
    if (pathname === '/waitlist' || pathname.startsWith('/api/')) {
      return;
    }

    const checkSiteStatus = async () => {
      try {
        console.log('[SITE REDIRECT] Checking site status for path:', pathname);
        
        const response = await fetch('/api/site-status', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[SITE REDIRECT] Site status:', data);
          
          if (data.status === 'inactive') {
            // Site is inactive - redirect to waitlist if not already there
            if (pathname !== '/waitlist') {
              console.log('[SITE REDIRECT] Site is inactive, redirecting to waitlist');
              router.push('/waitlist');
            }
          } else if (data.status === 'active') {
            // Site is active - redirect away from waitlist to homepage
            if (pathname === '/waitlist') {
              console.log('[SITE REDIRECT] Site is active, redirecting to homepage');
              router.push('/');
            } else {
              console.log('[SITE REDIRECT] Site is active, allowing normal access');
            }
          }
        } else {
          console.error('[SITE REDIRECT] Failed to fetch site status:', response.status);
          // Default to allowing access if check fails
        }
      } catch (error) {
        console.error('[SITE REDIRECT] Error checking site status:', error);
        // Default to allowing access if check fails
      }
    };

    checkSiteStatus();
  }, [pathname, router]);

  return null; // This component doesn't render anything
} 
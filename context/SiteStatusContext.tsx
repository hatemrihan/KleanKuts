'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SiteStatus {
  isActive: boolean;
  message: string;
  isLoading: boolean;
}

const SiteStatusContext = createContext<SiteStatus>({
  isActive: true,
  message: '',
  isLoading: true,
});

export const SiteStatusProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<SiteStatus>({
    isActive: true,
    message: '',
    isLoading: true,
  });
  const router = useRouter();
  const pathname = usePathname();
  const isWaitlistPage = pathname === '/waitlist';

  useEffect(() => {
    const checkSiteStatus = async () => {
      try {
        // Skip API calls if we're already on the waitlist page
        if (isWaitlistPage) {
          setStatus({
            isActive: false,
            message: '',
            isLoading: false,
          });
          return;
        }
        
        // First try to get from session storage to avoid too many API calls
        const cachedStatus = sessionStorage.getItem('siteStatus');
        const cacheTime = sessionStorage.getItem('siteStatusTime');
        
        // Use cached status if it's less than 5 minutes old
        if (cachedStatus && cacheTime) {
          const parsedStatus = JSON.parse(cachedStatus);
          const timeDiff = Date.now() - parseInt(cacheTime);
          
          // Cache for 5 minutes (300000 ms)
          if (timeDiff < 300000) {
            console.log('Using cached site status');

            // Check for any property that indicates the site is inactive
            const siteInactive = 
              parsedStatus.inactive === true || 
              parsedStatus.status === 'INACTIVE' || 
              parsedStatus.maintenance === true ||
              parsedStatus.active === false;

            setStatus({
              isActive: !siteInactive,
              message: parsedStatus.message || '',
              isLoading: false,
            });

            // If site is inactive and we're not on the waitlist page, redirect
            if (siteInactive && typeof window !== 'undefined') {
              const isAdmin = sessionStorage.getItem('adminOverride') === 'true';
              
              if (!isWaitlistPage && !isAdmin) {
                console.log('Site is inactive, redirecting to waitlist...');
                router.push('/waitlist');
              }
            }
            
            return;
          }
        }
        
        // Fetch fresh site status from the API with timeout and bypass cache
        console.log('Fetching site status from API');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          // Add timestamp to URL to prevent caching
          const cacheBuster = Date.now();
          const response = await fetch(`https://eleveadmin.netlify.app/api/site-status?t=${cacheBuster}`, {
            headers: {
              'Accept': 'application/json',
              'Origin': 'https://elevee.netlify.app',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            cache: 'no-store',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error('Failed to fetch site status');
          }
          
          const data = await response.json();
          console.log('Site status response:', data);
          
          // Save to session storage
          sessionStorage.setItem('siteStatus', JSON.stringify(data));
          sessionStorage.setItem('siteStatusTime', Date.now().toString());
          
          // Check for any property that indicates the site is inactive
          // Log the raw status data for debugging
          console.log('Raw site status data:', JSON.stringify(data));
          
          const siteInactive = 
            data.inactive === true || 
            data.status === 'INACTIVE' || 
            data.maintenance === true ||
            data.active === false ||
            data.status?.toLowerCase() === 'inactive' ||
            data.status?.toLowerCase() === 'maintenance';
          
          setStatus({
            isActive: !siteInactive,
            message: data.message || '',
            isLoading: false,
          });
          
          console.log('Site status:', !siteInactive ? 'ACTIVE' : 'INACTIVE');
          
          // If site is inactive and we're not on the waitlist page, redirect
          if (siteInactive && typeof window !== 'undefined') {
            const isAdmin = sessionStorage.getItem('adminOverride') === 'true';
            
            if (!isWaitlistPage && !isAdmin) {
              console.log('Site is inactive, redirecting to waitlist...');
              router.push('/waitlist');
            }
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('Error fetching site status:', fetchError);
          // On fetch error, default to active to prevent blocking access
          setStatus({
            isActive: true,
            message: '',
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking site status:', error);
        // Default to active if there's an error fetching status
        setStatus({
          isActive: true,
          message: '',
          isLoading: false,
        });
      }
    };

    checkSiteStatus();
    
    // Set up periodic check every 5 minutes
    const intervalId = setInterval(checkSiteStatus, 300000);
    
    return () => clearInterval(intervalId);
  }, [router, isWaitlistPage]);

  return (
    <SiteStatusContext.Provider value={status}>
      {children}
    </SiteStatusContext.Provider>
  );
};

export const useSiteStatus = () => useContext(SiteStatusContext); 
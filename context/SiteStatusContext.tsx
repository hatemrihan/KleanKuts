'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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

  useEffect(() => {
    const checkSiteStatus = async () => {
      try {
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
            setStatus({
              isActive: parsedStatus.active,
              message: parsedStatus.message || '',
              isLoading: false,
            });
            return;
          }
        }
        
        // Fetch fresh site status from the API
        console.log('Fetching site status from API');
        const response = await fetch('https://eleveadmin.netlify.app/api/site-status', {
          headers: {
            'Accept': 'application/json',
            'Origin': 'https://elevee.netlify.app'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch site status');
        }
        
        const data = await response.json();
        
        // Save to session storage
        sessionStorage.setItem('siteStatus', JSON.stringify(data));
        sessionStorage.setItem('siteStatusTime', Date.now().toString());
        
        setStatus({
          isActive: data.active,
          message: data.message || '',
          isLoading: false,
        });
        
        console.log('Site status:', data.active ? 'ACTIVE' : 'MAINTENANCE');
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
  }, []);

  return (
    <SiteStatusContext.Provider value={status}>
      {children}
    </SiteStatusContext.Provider>
  );
};

export const useSiteStatus = () => useContext(SiteStatusContext); 
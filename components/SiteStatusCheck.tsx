'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useSiteStatus } from '../context/SiteStatusContext';
import { useRouter } from 'next/navigation';
import { hasMaintenanceOverride } from '@/utils/maintenanceOverride';
import { usePathname } from 'next/navigation';

interface SiteStatusCheckProps {
  children: ReactNode;
}

const SiteStatusCheck: React.FC<SiteStatusCheckProps> = ({ children }) => {
  const { isActive, message, isLoading } = useSiteStatus();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isWaitlistPage = pathname === '/waitlist';
  
  useEffect(() => {
    // Check for admin override on client side
    setIsAdmin(hasMaintenanceOverride());
    
    // Store admin status in sessionStorage for other components
    if (hasMaintenanceOverride()) {
      sessionStorage.setItem('adminOverride', 'true');
    }
  }, []);
  
  // Redirect to waitlist if site is inactive and not an admin
  useEffect(() => {
    if (!isLoading && !isActive && !isAdmin && typeof window !== 'undefined') {
      // Only redirect if we're not already on the waitlist page
      if (!isWaitlistPage) {
        console.log('Site is inactive, redirecting to waitlist from SiteStatusCheck...');
        router.push('/waitlist');
      }
    }
  }, [isActive, isLoading, isAdmin, router, isWaitlistPage]);

  // Show loading indicator while checking status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-gray-200"></div>
      </div>
    );
  }

  // If admin override exists or the site is active, show regular content
  if (isAdmin || isActive) {
    return (
      <>
        {!isActive && isAdmin && (
          <div className="bg-yellow-500 text-black p-2 text-center text-sm">
            <p>⚠️ ADMIN VIEW: Site is in maintenance mode, but you're viewing it with an admin override.</p>
          </div>
        )}
        {children}
      </>
    );
  }

  // If we're already on the waitlist page, show children (the waitlist content)
  if (isWaitlistPage) {
    return <>{children}</>;
  }

  // If neither of the above, show a minimal loading screen while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-gray-200"></div>
      <p className="ml-3">Redirecting to waitlist...</p>
    </div>
  );
};

export default SiteStatusCheck; 
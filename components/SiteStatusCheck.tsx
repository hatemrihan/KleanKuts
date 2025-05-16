'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useSiteStatus } from '../context/SiteStatusContext';
import MaintenancePage from './MaintenancePage';
import { hasMaintenanceOverride } from '@/utils/maintenanceOverride';

interface SiteStatusCheckProps {
  children: ReactNode;
}

const SiteStatusCheck: React.FC<SiteStatusCheckProps> = ({ children }) => {
  const { isActive, message, isLoading } = useSiteStatus();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check for admin override on client side
    setIsAdmin(hasMaintenanceOverride());
  }, []);

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

  // Otherwise show maintenance page
  return <MaintenancePage message={message} />;
};

export default SiteStatusCheck; 
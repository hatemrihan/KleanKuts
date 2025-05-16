'use client';

import React from 'react';
import Link from 'next/link';

interface MaintenancePageProps {
  message?: string;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ message }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-900 rounded shadow-lg text-center transition-colors duration-300">
        <h1 className="text-4xl font-serif mb-6">ÉLEVÉ</h1>
        <h2 className="text-2xl font-bold mb-4">Site Under Maintenance</h2>
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {message || "We're currently updating our site to serve you better. Please check back soon."}
        </p>
        <div className="mb-8">
          <Link 
            href="#" 
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              window.location.reload();
            }}
          >
            Refresh the page
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          - The Élevé Team
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage; 
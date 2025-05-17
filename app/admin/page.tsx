"use client";

import React from 'react';
import Link from 'next/link';

const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your e-commerce store</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Products Management */}
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <p className="text-gray-600 mb-4">Manage your product inventory, add new products, and update existing ones.</p>
          <Link href="/admin/products" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Manage Products
          </Link>
        </div>
        
        {/* Categories Management */}
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <p className="text-gray-600 mb-4">Organize your products by creating and managing categories.</p>
          <Link href="/admin/categories" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Manage Categories
          </Link>
        </div>
        
        {/* Blacklist Management */}
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Blacklist</h2>
          <p className="text-gray-600 mb-4">View and manage blacklisted products or users.</p>
          <Link href="/admin/blacklist" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            View Blacklist
          </Link>
        </div>
        
        {/* Newsletter Subscribers */}
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Newsletter</h2>
          <p className="text-gray-600 mb-4">View and manage newsletter subscribers from the website footer.</p>
          <Link href="/admin/newsletter" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Manage Subscribers
          </Link>
        </div>
        
        {/* Store Settings */}
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Store Settings</h2>
          <p className="text-gray-600 mb-4">Configure general store settings, shipping, taxes, and payment options.</p>
          <Link href="/admin/settings" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700">
            Coming Soon
          </Link>
        </div>
        
        {/* Analytics */}
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <p className="text-gray-600 mb-4">View detailed statistics and reports about your store's performance.</p>
          <Link href="/admin/analytics" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700">
            Coming Soon
          </Link>
        </div>
      </div>
      
      {/* Back to Website */}
      <div className="mt-8 text-center">
        <Link 
          href="/" 
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Back to Website
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard; 
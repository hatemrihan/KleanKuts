'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '../sections/nav'
import { useCart } from '../context/CartContext'
import { processInventoryReduction } from '../utils/orderRedirect'

const ThankYouPage = () => {
  const router = useRouter()
  const { cart } = useCart()
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)
  
  useEffect(() => {
    // Check if order was just completed
    const checkOrderCompleted = async () => {
      // Get the completion flag from sessionStorage
      const completionFlag = sessionStorage.getItem('orderCompleted')
      
      if (completionFlag === 'true') {
        // Order was completed successfully
        console.log('🎉 Order completion detected on thank-you page')
        setOrderCompleted(true)
        setIsLoading(false)
        
        // Check for a pending order ID in sessionStorage
        const pendingOrderId = sessionStorage.getItem('pendingOrderId');
        if (pendingOrderId) {
          console.log('🔄 Processing inventory reduction for order:', pendingOrderId);
          setOrderId(pendingOrderId);
          
          try {
            // Process inventory reduction using the new system
            const result = await processInventoryReduction(pendingOrderId);
            console.log('Inventory reduction result:', result);
            
            // Clear the pending order ID
            sessionStorage.removeItem('pendingOrderId');
            
            // If inventory reduction was successful, update UI
            if (result.success) {
              const successElement = document.getElementById('success-message');
              if (successElement) {
                successElement.style.display = 'block';
              }
            }
          } catch (error) {
            console.error('Error processing inventory reduction:', error);
          }
        } else {
          // Try to get the order ID from localStorage (fallback)
          try {
            const lastOrderDetails = localStorage.getItem('lastOrderDetails');
            if (lastOrderDetails) {
              const orderDetails = JSON.parse(lastOrderDetails);
              if (orderDetails?.orderId) {
                console.log('Found order ID from last order details:', orderDetails.orderId);
                setOrderId(orderDetails.orderId);
              }
            }
          } catch (error) {
            console.error('Error getting order ID from localStorage:', error);
          }
        }
      } else {
        // No valid completion flag found, but DON'T redirect automatically
        // Instead, show a message that the page was accessed directly
        console.log('Thank-you page accessed without completing an order');
        setOrderCompleted(true); // Still show the page
        setIsLoading(false);
      }
    }
    
    checkOrderCompleted()
    
    // Cleanup on component unmount
    return () => {
      // Only remove the flag when navigating away from the page
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('orderCompleted')
      }
    }
  }, [router])
  
  // Check for any pending inventory updates that failed during checkout
  useEffect(() => {
    const checkPendingInventoryUpdates = async () => {
      try {
        // First, check for direct pendingOrderId which is the fastest path
        const pendingOrderId = sessionStorage.getItem('pendingOrderId');
        if (pendingOrderId) {
          console.log('🔍 Found pending order ID for inventory update:', pendingOrderId);
          try {
            // Import the updateInventory function dynamically to reduce initial load time
            const { updateInventory } = await import('../utils/inventoryUpdater');
            const result = await updateInventory(pendingOrderId);
            console.log('Inventory update result:', result);
            
            // Clear the pending order ID
            sessionStorage.removeItem('pendingOrderId');
            
            // If successful, show success message
            if (result.success) {
              const successElement = document.getElementById('success-message');
              if (successElement) {
                successElement.style.display = 'block';
              }
            }
            return; // Skip the rest of processing if we handled the pendingOrderId
          } catch (error) {
            console.error('Error processing pending order inventory:', error);
          }
        }
        
        // Check for pendingInventoryUpdates as backup method
        const pendingUpdatesJson = localStorage.getItem('pendingInventoryUpdates');
        if (!pendingUpdatesJson) return;
        
        const pendingUpdates = JSON.parse(pendingUpdatesJson);
        if (!pendingUpdates || !Array.isArray(pendingUpdates) || pendingUpdates.length === 0) {
          return;
        }
        
        console.log('🔍 Found pending inventory updates to process:', pendingUpdates);
        
        // Process each pending update
        for (const update of pendingUpdates) {
          try {
            console.log(`🔄 Processing pending inventory update for order: ${update.orderId}`);
            
            // Import the updateInventory function dynamically
            const { updateInventory } = await import('../utils/inventoryUpdater');
            const result = await updateInventory(update.orderId);
            
            if (result.success) {
              console.log(`✅ Successfully processed pending inventory update:`, result);
            } else {
              console.error(`❌ Failed to process pending inventory update:`, result.error);
            }
          } catch (error) {
            console.error(`❌ Error processing pending inventory update:`, error);
          }
        }
        
        // Clear the pending updates after processing
        localStorage.removeItem('pendingInventoryUpdates');
        console.log('🧹 Cleared pending inventory updates');
        
      } catch (error) {
        console.error('Error processing pending inventory updates:', error);
      }
    };
    
    // Run after a short delay to ensure the page has loaded
    const timer = setTimeout(() => {
      checkPendingInventoryUpdates();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }
  
  if (!orderCompleted) {
    return null // Don't render anything during validation/redirect
  }
  
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white dark:bg-black pt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-8 text-black dark:text-white transition-colors duration-300">THANK YOU FOR YOUR ORDER!</h1>
          
          <div className="max-w-2xl mx-auto space-y-6 text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <p>
              Your order has been successfully placed. We will contact you shortly to confirm your order and delivery details.
            </p>
            
            {orderId && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                <p className="font-medium text-black dark:text-white">Order ID: <span className="select-all">{orderId}</span></p>
                <p className="text-sm mt-1">Please save this ID for reference.</p>
              </div>
            )}
            
            {/* Stock reduction processing message - hidden by default */}
            <div id="processing-message" className="bg-blue-50 p-4 rounded-md text-blue-700 hidden">
              <p className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing inventory update...
              </p>
            </div>
            
            {/* Stock reduction success message - hidden by default */}
            <div id="success-message" className="bg-green-50 p-4 rounded-md text-green-700 hidden">
              <p className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Inventory has been updated successfully!
              </p>
            </div>
            
            {/* Stock reduction error message - hidden by default */}
            <div id="error-message" className="bg-red-50 p-4 rounded-md text-red-700 hidden">
              <p className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                There was an issue updating inventory. Don't worry, your order is still confirmed.
              </p>
            </div>
            
            {/* Navigation buttons */}
           
            <p>
              You will pay on delivery. Please have the exact amount ready.
            </p>
            <p className="text-sm">
              If you have any questions, feel free to contact us.
            </p>
          </div>

          <Link 
            href="/"
            className="inline-block mt-12 px-8 py-4 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors duration-300"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </>
  )
}

export default ThankYouPage 
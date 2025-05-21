/**
 * Utility functions to handle order completion and redirection
 * This ensures that after an order is placed, the user is redirected to the thank-you page
 * and stock levels are properly reduced
 */
import { reduceInventory } from './inventoryUtils';

// Function to redirect to thank-you page after order completion
export const redirectToThankYou = () => {
  console.log('🚀 Redirecting to thank-you page after successful order');
  
  // Mark the order as completed before redirecting
  // This flag is used by the thank-you page to determine if it should process the order
  sessionStorage.setItem('orderCompleted', 'true');
  
  // Debug - Check if pendingStockReduction exists before redirecting
  const pendingReduction = localStorage.getItem('pendingStockReduction');
  console.log('Before redirect - pendingStockReduction exists:', !!pendingReduction);
  if (pendingReduction) {
    console.log('pendingStockReduction content:', pendingReduction);
  }
  
  // Use window.location.href for a full page navigation
  // This is more reliable than router.push in some cases
  window.location.href = '/thank-you';
};

// Function to prepare order items for stock reduction
export const prepareOrderItemsForStockReduction = (cart: any[]) => {
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    console.error('❌ Invalid cart data provided to prepareOrderItemsForStockReduction:', cart);
    return [];
  }
  
  // Debug the incoming cart data
  console.log('🛒 Raw cart data for stock reduction:', JSON.stringify(cart));
  
  // Create properly formatted stock reduction items
  const orderItems = cart.map(item => ({
    productId: item.id,
    size: item.size,
    color: item.color || 'Default',
    quantity: item.quantity || 1,
    inventoryUpdated: false // Add flag for inventory tracking
  }));
  
  // Log the processed items
  console.log('📦 Processed order items for stock reduction:', JSON.stringify(orderItems));
  
  // Clear any existing pending reductions first
  localStorage.removeItem('pendingStockReduction');
  
  // Save to localStorage for later stock reduction on thank-you page
  localStorage.setItem('pendingStockReduction', JSON.stringify(orderItems));
  
  // Verify the data was saved correctly
  const savedData = localStorage.getItem('pendingStockReduction');
  console.log('✅ Verified pendingStockReduction saved:', !!savedData);
  if (savedData !== JSON.stringify(orderItems)) {
    console.error('❌ Data verification failed - saved data does not match expected data!');
  }
  
  return orderItems; // Return the prepared items for additional use if needed
};

// Function to process inventory reduction for an order
export const processInventoryReduction = async (orderId: string) => {
  try {
    console.log('Processing inventory reduction for order:', orderId);
    
    // Fetch the order details
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.order) {
      throw new Error('Invalid order data received');
    }
    
    // Skip if inventory was already processed
    if (data.order.inventoryProcessed) {
      console.log('Inventory already processed for this order');
      return { success: true, message: 'Inventory already processed' };
    }
    
    // Process inventory reduction using the new inventory system
    const result = await reduceInventory(data.order);
    
    // Mark the order as inventory processed
    if (result.success) {
      await fetch(`/api/orders/${orderId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryProcessed: true })
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error processing inventory reduction:', error);
    return { success: false, error: 'Failed to process inventory reduction' };
  }
};

// Combined function to handle both stock reduction and redirection
export const completeOrderAndRedirect = async (cart: any[], orderId?: string) => {
  try {
    // Prepare order items for stock reduction
    prepareOrderItemsForStockReduction(cart);
    
    // Set order completion flag in session storage
    sessionStorage.setItem('orderCompleted', 'true');
    
    // Store order ID for display on thank-you page
    if (orderId) {
      console.log('Storing order ID for thank-you page:', orderId);
      // Store the order ID for thank-you page to display
      sessionStorage.setItem('pendingOrderId', orderId);
      
      // Also store it in localStorage as backup
      try {
        localStorage.setItem('lastOrderDetails', JSON.stringify({
          orderId: orderId,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to store order details in localStorage:', err);
      }
      
      // Process inventory reduction after redirect
    } else {
      console.warn('No order ID provided to completeOrderAndRedirect');
    }
    
    console.log('Order completed successfully');
    
    // Redirect to thank-you page
    redirectToThankYou();
  } catch (error) {
    console.error('Error in completeOrderAndRedirect:', error);
    
    // Ensure redirection happens even if there's an error
    sessionStorage.setItem('orderCompleted', 'true');
    redirectToThankYou();
  }
};

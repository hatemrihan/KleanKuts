/**
 * Utility functions to handle order completion and redirection
 * This ensures that after an order is placed, the user is redirected to the thank-you page
 * and stock levels are properly reduced
 */

// Function to redirect to thank-you page after order completion
export const redirectToThankYou = () => {
  console.log('Redirecting to thank-you page after successful order');
  
  // Use window.location.href for a full page navigation
  // This is more reliable than router.push in some cases
  window.location.href = '/thank-you';
};

// Function to prepare order items for stock reduction
export const prepareOrderItemsForStockReduction = (cart: any[]) => {
  const orderItems = cart.map(item => ({
    productId: item.id,
    size: item.size,
    color: item.color || 'Default',
    quantity: item.quantity || 1
  }));
  
  // Save to localStorage for later stock reduction on thank-you page
  localStorage.setItem('pendingStockReduction', JSON.stringify(orderItems));
  console.log('Order items prepared for stock reduction:', orderItems);
  
  return orderItems;
};

// Combined function to handle both stock reduction and redirection
export const completeOrderAndRedirect = (cart: any[]) => {
  try {
    // Prepare order items for stock reduction
    prepareOrderItemsForStockReduction(cart);
    
    // Set order completion flag in session storage
    sessionStorage.setItem('orderCompleted', 'true');
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

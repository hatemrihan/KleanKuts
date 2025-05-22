// Coupon validation and redemption utilities for the deployed environment

// API URLs for validation and redemption
const ADMIN_API_URL = 'https://eleveadmin.netlify.app/api';
const FRONTEND_API_URL = 'https://elevee.netlify.app/api';

/**
 * Validate coupon code against multiple APIs to ensure successful validation
 */
export async function validateCoupon(code: string) {
  if (!code || !code.trim()) {
    return { valid: false, message: 'Please enter a valid coupon code' };
  }
  
  console.log(`Validating coupon code: ${code}`);
  
  // Try all validation methods in parallel for faster response
  const results = await Promise.allSettled([
    validateWithAdminAPI(code),
    validateWithFrontendAPI(code)
  ]);
  
  // Find first successful validation
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value && result.value.valid) {
      console.log('Successfully validated coupon:', result.value);
      return result.value;
    }
  }
  
  // If no successful validation, return the first error message
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value; // Return the first validation result (which will be invalid)
    }
  }
  
  // Fallback error if all promises rejected
  return { 
    valid: false, 
    message: 'Unable to validate coupon code. Please try again later.' 
  };
}

/**
 * Validate using Admin API
 */
async function validateWithAdminAPI(code: string) {
  try {
    console.log(`Using admin API for coupon: ${code}`);
    const response = await fetch(`${ADMIN_API_URL}/coupon/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ code: code.trim() })
    });
    
    if (!response.ok) {
      throw new Error(`Admin API returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Admin API response:', data);
    
    if (data && data.valid && data.discount) {
      return {
        valid: true,
        discount: data.discount,
        message: data.message || 'Coupon applied successfully'
      };
    }
    
    return {
      valid: false,
      message: data.message || 'Invalid coupon code'
    };
  } catch (error) {
    console.error('Error validating with Admin API:', error);
    throw error;
  }
}

/**
 * Validate using Frontend API
 */
async function validateWithFrontendAPI(code: string) {
  try {
    console.log(`Using frontend API for coupon: ${code}`);
    const response = await fetch(`${FRONTEND_API_URL}/promocodes/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: code.trim() })
    });
    
    if (!response.ok) {
      throw new Error(`Frontend API returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Frontend API response:', data);
    
    if (data && data.valid && data.discount) {
      return {
        valid: true,
        discount: data.discount,
        message: data.message || 'Coupon applied successfully'
      };
    }
    
    return {
      valid: false,
      message: data.message || 'Invalid coupon code'
    };
  } catch (error) {
    console.error('Error validating with Frontend API:', error);
    throw error;
  }
}

/**
 * Report a successful order with a coupon code to the ambassador system
 */
export async function reportSuccessfulOrder(orderDetails: any, couponCode: string) {
  if (!couponCode) return true; // No coupon to report
  
  try {
    console.log(`Reporting order with coupon ${couponCode} to ambassador system`);
    
    // Try Admin API first
    const adminResult = await reportToAdminAPI(orderDetails, couponCode)
      .catch(error => {
        console.error('Admin API reporting error:', error);
        return false;
      });
    
    if (adminResult) {
      console.log('Successfully reported to admin API');
      return true;
    }
    
    // Try Frontend API as fallback
    const frontendResult = await reportToFrontendAPI(orderDetails, couponCode)
      .catch(error => {
        console.error('Frontend API reporting error:', error);
        return false;
      });
    
    return frontendResult;
  } catch (error) {
    console.error('Error reporting order to ambassador system:', error);
    return false; // Return false, but don't block the order completion
  }
}

/**
 * Report to Admin API
 */
async function reportToAdminAPI(orderDetails: any, couponCode: string) {
  const response = await fetch(`${ADMIN_API_URL}/coupon/redeem`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      code: couponCode,
      orderId: orderDetails.orderId,
      orderAmount: orderDetails.total,
      customerEmail: orderDetails.email,
      products: orderDetails.products ? orderDetails.products.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })) : []
    })
  });
  
  if (!response.ok) {
    throw new Error(`Admin API returned status ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Order reported to ambassador system:', data);
  return data.success;
}

/**
 * Report to Frontend API
 */
async function reportToFrontendAPI(orderDetails: any, couponCode: string) {
  const response = await fetch(`${FRONTEND_API_URL}/ambassador/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: couponCode,
      orderAmount: orderDetails.total,
      orderId: orderDetails.orderId
    })
  });
  
  if (!response.ok) {
    throw new Error(`Frontend API returned status ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Order reported to frontend ambassador system:', data);
  return data.success;
}

/**
 * Calculate discount amount based on percentage and cart total
 */
export function calculateDiscountAmount(discountPercentage: number, cartTotal: number): number {
  if (!discountPercentage || discountPercentage <= 0) return 0;
  
  // Calculate discount amount from percentage
  const discountAmount = (cartTotal * discountPercentage) / 100;
  return discountAmount;
}

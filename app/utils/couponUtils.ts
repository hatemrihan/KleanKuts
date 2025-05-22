// Coupon validation and redemption utilities for the deployed environment

// ONLY use the admin API in production - both sites are already deployed
const ADMIN_API_URL = 'https://eleveadmin.netlify.app/api';

/**
 * Direct validation for ambassador coupon codes
 * Fetches and applies discount based on data from admin panel
 */
export async function validateCoupon(code: string) {
  console.log(`Validating coupon code: ${code}`);
  
  // Normalized code for case-insensitive comparison
  const normalizedCode = code.toLowerCase().trim();
  
  try {
    console.log(`Using admin API for coupon: ${code}`);
    const response = await fetch(`${ADMIN_API_URL}/coupon/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      console.warn(`Admin API returned status ${response.status}`);      
      
      // Try the API endpoint from the frontend site as a fallback
      try {
        const frontendResponse = await fetch(`https://elevee.netlify.app/api/promocodes/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        });
        
        if (frontendResponse.ok) {
          const frontendData = await frontendResponse.json();
          if (frontendData.valid && frontendData.discount) {
            return frontendData;
          }
        }
      } catch (frontendError) {
        console.error('Frontend API fallback error:', frontendError);
      }
      
      return { valid: false, message: 'Invalid coupon code' };
    }
    
    const data = await response.json();
    console.log('Admin API response:', data);
    
    if (data && data.valid && data.discount) {
      return {
        valid: true,
        discount: data.discount,
        message: data.message || 'Coupon applied successfully'
      };
    } else {
      return {
        valid: false,
        message: data.message || 'Invalid coupon code'
      };
    }
  } catch (error) {
    console.error('Error validating coupon:', error);
    
    // Try the API endpoint from the frontend site as a final fallback
    try {
      const frontendResponse = await fetch(`https://elevee.netlify.app/api/promocodes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      if (frontendResponse.ok) {
        const frontendData = await frontendResponse.json();
        if (frontendData.valid && frontendData.discount) {
          return frontendData;
        }
      }
    } catch (frontendError) {
      console.error('Frontend API fallback error:', frontendError);
    }
    
    return {
      valid: false,
      message: 'Unable to validate coupon. Please try again later.'
    };
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
    
    const data = await response.json();
    console.log('Order reported to ambassador system:', data);
    
    // If admin API fails, try the frontend API as a fallback
    if (!response.ok || !data.success) {
      try {
        const frontendResponse = await fetch(`https://elevee.netlify.app/api/ambassador/orders`, {
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
        
        const frontendData = await frontendResponse.json();
        console.log('Order reported to frontend ambassador system:', frontendData);
        return frontendData.success;
      } catch (frontendError) {
        console.error('Frontend API fallback error:', frontendError);
      }
    }
    
    return data.success;
  } catch (error) {
    console.error('Error reporting order to ambassador system:', error);
    
    // Try the frontend API as a fallback
    try {
      const frontendResponse = await fetch(`https://elevee.netlify.app/api/ambassador/orders`, {
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
      
      const frontendData = await frontendResponse.json();
      console.log('Order reported to frontend ambassador system:', frontendData);
      return frontendData.success;
    } catch (frontendError) {
      console.error('Frontend API fallback error:', frontendError);
    }
    
    return false; // Return false, but don't block the order completion
  }
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

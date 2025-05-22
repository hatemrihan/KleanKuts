// Coupon validation and redemption utilities for the deployed environment

// ONLY use the admin API in production - both sites are already deployed
const ADMIN_API_URL = 'https://eleveadmin.netlify.app/api';

// Fallback ambassador discount from MongoDB (only used if API fails)
const AMBASSADOR_DISCOUNT_PERCENT = 10;

/**
 * Direct validation for ambassador coupon codes
 * Prioritizes data from admin panel but falls back to local validation if needed
 */
export async function validateCoupon(code: string) {
  console.log(`Validating coupon code: ${code}`);
  
  // Normalized code for case-insensitive comparison
  const normalizedCode = code.toLowerCase().trim();
  
  // Known ambassador codes from MongoDB (fallback if API fails)
  const knownAmbassadorCodes = ['wala', 'hola'];
  
  // Try admin API first
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
      
      // Fallback: Check if this is a known ambassador code
      if (knownAmbassadorCodes.includes(normalizedCode)) {
        console.log(`✅ Recognized ambassador code: ${code}. Applying ${AMBASSADOR_DISCOUNT_PERCENT}% discount as fallback`);
        return {
          valid: true,
          discount: {
            type: 'percentage',
            value: AMBASSADOR_DISCOUNT_PERCENT,
            code: code,
            minPurchase: 0,
            referralCode: 'elv_d481659c', // Ambassador referral code from MongoDB
            isAmbassador: true,
            ambassadorId: normalizedCode === 'wala' ? 'hatemrihan100@gmail.com' : undefined
          },
          message: `Ambassador coupon applied (${AMBASSADOR_DISCOUNT_PERCENT}% discount)`
        };
      }
      
      // Try the frontend API as a fallback
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
      // Double-check if it's a known ambassador code before rejecting
      if (knownAmbassadorCodes.includes(normalizedCode)) {
        console.log(`✅ Admin API didn't validate but this is a known code: ${code}. Using fallback.`);
        return {
          valid: true,
          discount: {
            type: 'percentage',
            value: AMBASSADOR_DISCOUNT_PERCENT,
            code: code,
            minPurchase: 0,
            referralCode: 'elv_d481659c', // Ambassador referral code from MongoDB
            isAmbassador: true,
            ambassadorId: normalizedCode === 'wala' ? 'hatemrihan100@gmail.com' : undefined
          },
          message: `Ambassador coupon applied (${AMBASSADOR_DISCOUNT_PERCENT}% discount)`
        };
      }
      
      return {
        valid: false,
        message: data.message || 'Invalid coupon code'
      };
    }
  } catch (error) {
    console.error('Error validating coupon:', error);
    
    // Fallback to local validation for known ambassador codes
    if (knownAmbassadorCodes.includes(normalizedCode)) {
      console.log(`✅ API error but recognized ambassador code: ${code}. Using fallback.`);
      return {
        valid: true,
        discount: {
          type: 'percentage',
          value: AMBASSADOR_DISCOUNT_PERCENT,
          code: code,
          minPurchase: 0,
          referralCode: 'elv_d481659c', // Ambassador referral code from MongoDB
          isAmbassador: true,
          ambassadorId: normalizedCode === 'wala' ? 'hatemrihan100@gmail.com' : undefined
        },
        message: `Ambassador coupon applied (${AMBASSADOR_DISCOUNT_PERCENT}% discount)`
      };
    }
    
    // Try the frontend API as a final fallback
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

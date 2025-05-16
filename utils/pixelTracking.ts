/**
 * Utility functions for Facebook Pixel tracking
 */

// Track a standard event
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
    console.log(`[FB Pixel] Tracked event: ${eventName}`, params || '');
  } else {
    console.log(`[FB Pixel] Could not track event ${eventName} - fbq not available`);
  }
};

// Track a custom event
export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
    console.log(`[FB Pixel] Tracked custom event: ${eventName}`, params || '');
  } else {
    console.log(`[FB Pixel] Could not track custom event ${eventName} - fbq not available`);
  }
};

// Track a page view
export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
    console.log('[FB Pixel] Tracked PageView');
  } else {
    console.log('[FB Pixel] Could not track PageView - fbq not available');
  }
};

// Track add to cart event
export const trackAddToCart = (
  content_ids: string[],
  content_name: string,
  value: number,
  currency: string = 'EGP',
  content_type: string = 'product'
) => {
  trackEvent('AddToCart', {
    content_ids,
    content_name,
    value,
    currency,
    content_type
  });
};

// Track purchase event
export const trackPurchase = (
  value: number,
  content_ids: string[],
  num_items: number,
  currency: string = 'EGP',
  content_type: string = 'product'
) => {
  trackEvent('Purchase', {
    value,
    content_ids,
    num_items,
    currency,
    content_type
  });
};

// Track checkout initiation
export const trackInitiateCheckout = (
  content_ids: string[],
  value: number,
  num_items: number,
  currency: string = 'EGP'
) => {
  trackEvent('InitiateCheckout', {
    content_ids,
    value,
    num_items,
    currency
  });
};

// Track when a user completes registration
export const trackCompleteRegistration = (
  value: number = 0,
  currency: string = 'EGP',
  status: boolean = true
) => {
  trackEvent('CompleteRegistration', {
    value,
    currency,
    status: status ? 'success' : 'failure'
  });
};

// Track when a user views content
export const trackViewContent = (
  content_ids: string[],
  content_name: string,
  content_type: string = 'product',
  value: number = 0,
  currency: string = 'EGP'
) => {
  trackEvent('ViewContent', {
    content_ids,
    content_name,
    content_type,
    value,
    currency
  });
};

// Track search
export const trackSearch = (
  search_string: string,
  content_ids?: string[],
  content_type: string = 'product',
  content_category?: string
) => {
  trackEvent('Search', {
    search_string,
    content_ids,
    content_type,
    content_category
  });
};

export default {
  trackEvent,
  trackCustomEvent,
  trackPageView,
  trackAddToCart,
  trackPurchase,
  trackInitiateCheckout,
  trackCompleteRegistration,
  trackViewContent,
  trackSearch
}; 
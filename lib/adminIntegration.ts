/**
 * Admin Panel Integration Helper Functions
 * 
 * This file contains helper functions for integrating with the admin panel.
 * It centralizes the implementation of the changes required by the admin team.
 */

/**
 * Gets the correct product edit URL for the admin panel
 * @param productId - The ID of the product to edit
 * @returns The full URL to the admin product edit page
 */
export const getAdminProductEditUrl = (productId: string): string => {
  return `https://eleveadmin.netlify.app/products/edit/${productId}`;
};

/**
 * Ensures compatibility with both title and name fields in product data
 * @param product - The product data object
 * @returns The product with normalized title and name fields
 */
export const normalizeProductFields = (product: any): any => {
  if (!product) return product;
  
  // Make a copy to avoid modifying the original
  const normalizedProduct = { ...product };
  
  // Ensure both title and name fields exist
  if (normalizedProduct.title && !normalizedProduct.name) {
    normalizedProduct.name = normalizedProduct.title;
  } else if (normalizedProduct.name && !normalizedProduct.title) {
    normalizedProduct.title = normalizedProduct.name;
  }
  
  return normalizedProduct;
};

/**
 * Ensures product images are correctly using Cloudinary URLs
 * @param product - The product data object
 * @returns The product with validated image URLs
 */
export const ensureCloudinaryImages = (product: any): any => {
  if (!product) return product;
  
  // Make a copy to avoid modifying the original
  const normalizedProduct = { ...product };
  
  // Process image fields to ensure they use Cloudinary URLs
  const processImages = (images: string[] | undefined): string[] => {
    if (!images || !Array.isArray(images)) return [];
    
    return images.map(img => {
      // If not a Cloudinary URL, it might need conversion
      if (img && !img.includes('cloudinary.com')) {
        // For non-Cloudinary URLs, this logic would depend on how your images 
        // are supposed to be transformed to Cloudinary URLs
        // This is a placeholder - implement based on your migration logic
        if (img.startsWith('http')) {
          // Already a full URL but not Cloudinary - may need special handling
          return img;
        } else {
          // Might be a relative path that needs to be converted to Cloudinary
          const imageName = img.split('/').pop() || '';
          return `https://res.cloudinary.com/dvcs7czio/image/upload/v1/samples/ecommerce/${imageName}`;
        }
      }
      return img;
    });
  };
  
  // Process all image-related fields
  if (normalizedProduct.selectedImages) {
    normalizedProduct.selectedImages = processImages(normalizedProduct.selectedImages);
  }
  
  if (normalizedProduct.images) {
    normalizedProduct.images = processImages(normalizedProduct.images);
  }
  
  if (normalizedProduct.image && typeof normalizedProduct.image === 'string') {
    normalizedProduct.image = processImages([normalizedProduct.image])[0];
  }
  
  return normalizedProduct;
};

// API base URL - use production for both since localhost CORS is not configured
const API_BASE_URL = 'https://eleveadmin.netlify.app/api';

/**
 * Test API connectivity as suggested by admin
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log('[API TEST] Testing connection to:', `${API_BASE_URL}/site-status`);
    
    const response = await fetch(`${API_BASE_URL}/site-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('API Connection Test:', data);
    return true;
  } catch (error) {
    console.error('API Connection Failed:', error);
    return false;
  }
}

/**
 * Send one e-mail to the Admin wait-list API.
 * Using our own API route to bypass CORS issues.
 */
export async function submitToWaitlist(email: string): Promise<boolean> {
  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    console.log('[DEBUG] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[DEBUG] Response data:', data);
      return true;
    } else {
      console.error('[WAITLIST] API responded', response.status);
      return false;
    }
  } catch (err) {
    console.error('[WAITLIST] network error', err);
    return false;
  }
}

/**
 * Checks if the site is in maintenance mode (inactive)
 * @returns Object with site status information
 */
export const checkSiteStatus = async (): Promise<{ 
  inactive: boolean; 
  maintenanceMessage?: string;
}> => {
  try {
    const response = await fetch('https://eleveadmin.netlify.app/api/site-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=5'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch site status:', response.status);
      return { inactive: false };
    }
    
    const data = await response.json();
    return { 
      inactive: !!data.inactive || !!data.maintenance, 
      maintenanceMessage: data.message || 'Site is currently under maintenance'
    };
  } catch (error) {
    console.error('Error checking site status:', error);
    return { inactive: false };
  }
}; 
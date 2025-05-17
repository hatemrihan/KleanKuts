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

/**
 * Submits an email to the waitlist and ensures the count is updated
 * @param email - The email to submit
 * @param source - The source of the submission (default: 'website')
 * @returns Whether the submission was successful
 */
export const submitToWaitlist = async (
  email: string, 
  source: string = 'website'
): Promise<boolean> => {
  try {
    // Submit to the main waitlist endpoint
    const mainResponse = await fetch('https://eleveadmin.netlify.app/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, source })
    });
    
    // Check if the main submission was successful
    if (mainResponse.status !== 201) {
      console.error('Failed to submit to waitlist:', mainResponse.status);
      return false;
    }
    
    // Also submit to the count endpoint
    try {
      const countResponse = await fetch('https://eleveadmin.netlify.app/api/waitlist/count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source })
      });
      
      if (!countResponse.ok) {
        console.warn('Failed to update waitlist count, but main submission succeeded');
      }
    } catch (countError) {
      console.warn('Error updating waitlist count:', countError);
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting to waitlist:', error);
    return false;
  }
}; 
/**
 * Utility functions for handling product images with Cloudinary integration
 */

/**
 * Optimizes a Cloudinary image URL with transformation parameters
 * @param imageUrl - The original Cloudinary image URL
 * @param options - Transformation options
 * @returns Optimized image URL with transformation parameters
 */
export const optimizeCloudinaryUrl = (
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | string;
    crop?: 'limit' | 'fill' | 'crop';
  } = {}
): string => {
  // If it's not a Cloudinary URL, return it as is
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }

  // Default options
  const {
    width = 800,
    quality = 'auto',
    format = 'auto',
    crop = 'limit'
  } = options;

  // Build transformation string
  const transformations = `w_${width},c_${crop},q_${quality},f_${format}`;

  // Check if URL already has query parameters
  const separator = imageUrl.includes('?') ? '&' : '?';
  
  return `${imageUrl}${separator}${transformations}`;
};

/**
 * Creates responsive image URLs for different device sizes
 * @param imageUrl - The original Cloudinary image URL
 * @returns Object with URLs for different device sizes
 */
export const getResponsiveImageUrls = (imageUrl: string) => {
  return {
    thumbnail: optimizeCloudinaryUrl(imageUrl, { width: 200 }),
    mobile: optimizeCloudinaryUrl(imageUrl, { width: 600 }),
    desktop: optimizeCloudinaryUrl(imageUrl, { width: 1200 })
  };
};

/**
 * Processes an image URL to handle both Cloudinary and legacy formats
 * @param imageUrl - The image URL to process
 * @returns Processed image URL
 */
export const processImageUrl = (imageUrl: string): string => {
  // If it's already a full URL (http or https), use it as is
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return imageUrl;
  }
  
  // If it's a local path starting with /images or /uploads, convert to Cloudinary URL
  // This handles the transition from local storage to Cloudinary
  if (imageUrl && (imageUrl.startsWith('/images/') || imageUrl.startsWith('/uploads/'))) {
    // This is a legacy URL format, we need to map it to Cloudinary
    // The actual mapping would depend on how the images were migrated to Cloudinary
    // For now, we'll return a placeholder Cloudinary URL
    const imageName = imageUrl.split('/').pop() || '';
    return `https://res.cloudinary.com/dvcs7czio/image/upload/v1234567890/samples/ecommerce/${imageName}`;
  }
  
  // If it's already a Cloudinary URL without the https:// prefix, add it
  if (imageUrl && imageUrl.startsWith('res.cloudinary.com')) {
    return `https://${imageUrl}`;
  }
  
  // Return the original URL if none of the above conditions are met
  return imageUrl || '';
};

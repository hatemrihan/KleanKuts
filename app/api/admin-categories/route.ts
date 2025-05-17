import { NextResponse } from 'next/server';

// Define the category type
interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  headline?: string;
  subheadline?: string;
  displayOrder: number;
  isActive: boolean;
  image?: string;
  mobileImage?: string;
  additionalImages?: string[];
  layout?: any;
  desktopDescription?: string;
  mobileDescription?: string;
  callToAction?: any;
  customStyles?: any;
  parent?: any;
  [key: string]: any; // Allow additional properties
}

// Default fallback category with attractive styling and content
const FALLBACK_CATEGORY = {
  _id: "fallback-category",
  name: "Featured Collection",
  slug: "featured-collection",
  description: "Our latest collection of premium products.",
  headline: "FEATURED COLLECTION",
  subheadline: "ELEVATE YOUR STYLE",
  displayOrder: 0,
  isActive: true,
  image: "https://res.cloudinary.com/dvcs7czio/image/upload/v1747425378/samples/ecommerce/leather-bag-gray.jpg",
  mobileImage: "https://res.cloudinary.com/dvcs7czio/image/upload/v1747425380/samples/ecommerce/accessories-bag.jpg",
  additionalImages: [],
  customStyles: {
    textColor: "#ffffff",
    backgroundColor: "#000000",
    overlayOpacity: 0.3
  }
};

// Proxy API to fetch categories from the admin server
export async function GET() {
  try {
    console.log('DIAGNOSTIC - Fetching from admin API');
    const fetchStartTime = Date.now();
    
    // Debug info
    let diagnosticInfo = {
      timestamp: new Date().toISOString(),
      adminUrl: 'https://eleveadmin.netlify.app/api/storefront/categories',
      responseStatus: null as number | null,
      responseTime: null as string | null,
      responseLength: null as number | string | null,
      corsHeaders: null as Record<string, string | null> | null,
      error: null as string | null
    };
    
    // Use the admin API with additional headers
    const response = await fetch('https://eleveadmin.netlify.app/api/storefront/categories', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://elevee.netlify.app',
        'X-Diagnostic-Request': 'true'
      },
      cache: 'no-store'
    }).catch(err => {
      diagnosticInfo.error = `Network error: ${err.message}`;
      return null;
    });
    
    // Calculate response time
    diagnosticInfo.responseTime = `${Date.now() - fetchStartTime}ms`;
    
    // Check for response failure
    if (!response) {
      console.error('DIAGNOSTIC - No response from admin API', diagnosticInfo);
      return NextResponse.json({
        categories: [FALLBACK_CATEGORY],
        diagnostic: diagnosticInfo,
        message: "Unable to connect to admin API - Using fallback category"
      });
    }
    
    // Capture response status
    diagnosticInfo.responseStatus = response.status;
    
    // Capture CORS headers for debugging
    diagnosticInfo.corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    };
    
    // Check for error response
    if (!response.ok) {
      console.error(`DIAGNOSTIC - Admin API error: ${response.status}`, diagnosticInfo);
      return NextResponse.json({
        categories: [FALLBACK_CATEGORY],
        diagnostic: diagnosticInfo,
        message: `Admin API returned error status: ${response.status}`
      });
    }
    
    // Get the raw categories data
    const rawData = await response.json();
    diagnosticInfo.responseLength = Array.isArray(rawData) ? rawData.length : 'not an array';
    
    console.log(`DIAGNOSTIC - Admin API returned ${diagnosticInfo.responseLength} categories`);
    
    // Check for empty response
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      console.warn('DIAGNOSTIC - Admin API returned empty array', diagnosticInfo);
      
      // Return specific message for empty array to help admin debug
      return NextResponse.json({
        categories: [FALLBACK_CATEGORY],
        diagnostic: diagnosticInfo,
        message: "Admin API returned empty array - No categories found in database"
      });
    }
    
    // Transform each category to match our expected format
    const transformedData = rawData.map(category => {
      // Add diagnostic info about this category
      console.log(`DIAGNOSTIC - Processing category: ${category.name} (${category._id})`);
      
      // Create the images object in our expected format
      const images = {
        main: category.image || category.images?.main || '',
        mobile: category.mobileImage || category.images?.mobile || category.image || '',
        gallery: category.additionalImages || category.images?.gallery || []
      };
      
      // Create the layout objects in our expected format
      const desktopLayout = {
        imagePosition: category.desktopLayout?.imagePosition || 'right',
        textAlignment: category.desktopLayout?.textAlignment || 'left',
        description: category.desktopDescription || category.desktopLayout?.description || category.description || ''
      };
      
      const mobileLayout = {
        imagePosition: category.mobileLayout?.imagePosition || 'top',
        textAlignment: category.mobileLayout?.textAlignment || 'center',
        description: category.mobileDescription || category.mobileLayout?.description || category.description || ''
      };
      
      // Create a full category object with all required properties
      return {
        ...category,
        images,
        desktopLayout,
        mobileLayout,
        isActive: category.isActive === undefined ? true : category.isActive
      };
    });
    
    console.log(`DIAGNOSTIC - Transformed ${transformedData.length} categories`);
    
    // Return the transformed categories with diagnostic info
    return NextResponse.json({
      categories: transformedData,
      diagnostic: diagnosticInfo,
      message: "Categories successfully fetched and transformed"
    });
  } catch (error: any) {
    console.error('DIAGNOSTIC - Error in admin-categories API:', error);
    
    // Return the error with the fallback category
    return NextResponse.json({
      categories: [FALLBACK_CATEGORY],
      diagnostic: {
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error'
      },
      message: "Error processing categories - Using fallback category"
    });
  }
} 
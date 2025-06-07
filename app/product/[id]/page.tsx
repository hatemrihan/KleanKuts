'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Nav from '@/app/sections/nav'
import Footer from '@/app/sections/footer'
import { useCart } from '@/app/context/CartContext'
import { AnimatePresence, motion } from "framer-motion"
import { twMerge } from "tailwind-merge"
import { optimizeCloudinaryUrl, processImageUrl } from '@/app/utils/imageUtils';
import { initStockSync, forceRefreshStock, markProductAsRecentlyOrdered } from '@/app/utils/stockSync';
import axios from 'axios'
// For WebSocket connection
import { io } from 'socket.io-client';
import NewFooter from '@/app/sections/NewFooter'
import Products from '@/app/sections/products'
import NewArrivals from '@/app/sections/NewArrivals'

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image: string;
  discount?: number;
  _stockInfo?: {
    originalStock: number;
    size: string;
    color: string;
  };
}

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder: boolean;
}

interface ColorVariant {
  color: string;
  hexCode?: string;
  stock: number;
}

interface SizeVariant {
  size: string;
  colorVariants: ColorVariant[];
}

interface Product {
  _id: string;
  name: string;
  title?: string;
  price: number;
  images: string[];
  description: string;
  Material: string[];
  sizes: SizeStock[];
  sizeVariants?: SizeVariant[];
  discount?: number;
  categories?: string[];
  materials?: string[];
  sizeGuide?: string;
  packaging?: string;
  shippingReturns?: string;
  gender?: string;
  variants?: Array<{
    size: string;
    color: string;
    stock: number;
    isPreOrder?: boolean;
  }>;
}

type Props = {
  params: {
    id: string
  }
}

const ProductPage = ({ params }: Props) => {
  const { id } = params
  const router = useRouter()
  const pathname = usePathname()
  const { addToCart } = useCart()
  
  // State
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [availableColors, setAvailableColors] = useState<ColorVariant[]>([])
  const [showAddedAnimation, setShowAddedAnimation] = useState(false)
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(false)
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [orderStatus, setOrderStatus] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handler functions for the buttons
  const handleAddToCartClick = () => {
    // Call the existing handleAddToCart function
    handleAddToCart();
  }

  const handleBuyNowClick = () => {
    // Add to cart first
    handleAddToCart();
    // Then redirect to checkout
    router.push('/checkout');
  }
  
  // Function to get available stock for the current selected size and color
  const getAvailableStock = (): number => {
    // Default max stock if we can't determine actual stock
    const DEFAULT_MAX_STOCK = 10;
    
    // If no product or no size selected, return default
    if (!product || !selectedSize) {
      return DEFAULT_MAX_STOCK;
    }
    
    // If using size variants and color is selected
    if (product.sizeVariants && selectedSize && selectedColor) {
      // Find the selected size variant
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize);
      if (sizeVariant && sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants)) {
        // Find the selected color variant
        const colorVariant = sizeVariant.colorVariants.find(cv => cv.color === selectedColor);
        if (colorVariant && typeof colorVariant.stock === 'number') {
          // Return the actual stock for this size/color combination
          return colorVariant.stock;
        }
      }
    }
    
    // If using size variants but no color selected
    if (product.sizeVariants && selectedSize) {
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize);
      if (sizeVariant && sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants)) {
        // Calculate total stock across all colors for this size
        return sizeVariant.colorVariants.reduce((sum, cv) => sum + (cv.stock || 0), 0);
      }
    }
    
    // If using simple sizes
    if (product.sizes && selectedSize) {
      const sizeOption = product.sizes.find(s => s.size === selectedSize);
      if (sizeOption) {
        return sizeOption.stock;
      }
    }
    
    // Fallback to default max stock
    return DEFAULT_MAX_STOCK;
  };
  
  // Function to check if product is sold out using admin API format
  const isProductSoldOut = (): boolean => {
    if (!product) return false;

    // Check sizeVariants first (primary method from admin API)
    if ((product as any).sizeVariants && Array.isArray((product as any).sizeVariants)) {
      let totalStock = 0;

      (product as any).sizeVariants.forEach((sizeVariant: any) => {
        if (sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants)) {
          sizeVariant.colorVariants.forEach((colorVariant: any) => {
            totalStock += (colorVariant.stock || 0);
          });
        }
      });

      return totalStock === 0;
    }

    // Fallback to legacy stock field
    if ((product as any).stock !== undefined) {
      return ((product as any).stock || 0) === 0;
    }

    // Local variants checking (for fallback products)
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      const allOutOfStock = product.sizes.every(size => 
        (typeof size.stock === 'number' && size.stock <= 0)
      );
      return allOutOfStock;
    }
    
    return false;
  };

  // Function to check if selected size/color is sold out
  const isSelectedVariantSoldOut = (): boolean => {
    if (!product || !selectedSize) return false;

    // For size variants with colors
    if (product.sizeVariants && selectedColor) {
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize);
      if (sizeVariant && sizeVariant.colorVariants) {
        const colorVariant = sizeVariant.colorVariants.find(cv => cv.color === selectedColor);
        return colorVariant ? (colorVariant.stock || 0) === 0 : true;
      }
    }

    // For simple sizes
    if (product.sizes) {
      const sizeOption = product.sizes.find(s => s.size === selectedSize);
      return sizeOption ? (sizeOption.stock || 0) === 0 : true;
    }

    return false;
  };
  
  // Effect to update available colors when size changes
  useEffect(() => {
    if (product && product.sizeVariants && selectedSize) {
      console.log('Product sizeVariants:', product.sizeVariants);
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize);
      console.log('Selected size variant:', sizeVariant);
      
      if (sizeVariant) {
        let colorVariantsToUse = [];
        
        // Case 1: Size variant has color variants array
        if (sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants) && sizeVariant.colorVariants.length > 0) {
          // Process existing color variants
          colorVariantsToUse = sizeVariant.colorVariants.map(cv => {
            console.log('Processing existing color variant:', cv);
            return {
              ...cv,
              color: cv.color || 'Default',
              stock: Number(cv.stock) || 0,
              hexCode: cv.hexCode || '#000000'
            };
          });
        }
        // Case 2: Size variant has no color variants - create a default one
        else {
          // Create a default color variant with the size's stock
          // Use a type assertion to handle the potential missing stock property
          const defaultStock = typeof (sizeVariant as any).stock === 'number' ? (sizeVariant as any).stock : 0;
          colorVariantsToUse = [{
            color: 'Default',
            stock: defaultStock,
            hexCode: '#000000'
          }];
          console.log(`Created default color variant for size ${sizeVariant.size} with stock ${defaultStock}`);
        }
        
        console.log('Final color variants with stock:', colorVariantsToUse);
        setAvailableColors(colorVariantsToUse);
        
        // Auto-select first color if available
        if (colorVariantsToUse.length > 0 && !selectedColor) {
          setSelectedColor(colorVariantsToUse[0].color);
        }
      } else {
        // If size variant not found, set to empty array
        console.log('Size variant not found for selected size');
        setAvailableColors([]);
      }
    } else {
      console.log('No product, size variants, or selected size');
      setAvailableColors([]);
    }
  }, [product, selectedSize, selectedColor])
  
  // Effect to preserve selected size when product updates - ONLY runs on initial product load
  useEffect(() => {
    if (product && !selectedSize) { // Only run if no size is selected yet
      console.log('Initial product load, selecting first size');
      
      if (product.sizeVariants && Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) {
        console.log('Selecting first available size variant:', product.sizeVariants[0].size);
        setSelectedSize(product.sizeVariants[0].size);
      } else if (product.sizes && product.sizes.length > 0) {
        console.log('Selecting first available size from sizes array:', product.sizes[0].size);
        setSelectedSize(product.sizes[0].size);
      }
    }
    
    // Fetch new arrivals for the bottom section
    const fetchNewArrivals = async () => {
      try {
        setLoadingNewArrivals(true);
        
        // Add timestamp to prevent caching and exclude current product
        const timestamp = Date.now();
        const randomValue = Math.random().toString(36).substring(2, 10); // Add random value to prevent caching
        
        // Use the updated API endpoint with proper query parameters
        const response = await fetch(`/api/products?limit=6&featured=true&timestamp=${timestamp}&r=${randomValue}&exclude=${id}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          // Add a reasonable timeout
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle both response formats (array or { products: array })
          let productsArray = [];
          
          if (data && Array.isArray(data)) {
            // Direct array response
            console.log('Products API returned direct array');
            productsArray = data;
          } else if (data && Array.isArray(data.products)) {
            // Object with products array
            console.log('Products API returned object with products array');
            productsArray = data.products;
          } else {
            console.log('Unexpected products API response format:', data);
            setNewArrivals([]);
            return;
          }
          
          // Filter out the current product if it's still in the results
          // Also handle different ID formats
          const filteredProducts = productsArray.filter((prod: any) => {
            if (!prod) return false;
            
            // Check different ID formats
            const prodId = typeof prod._id === 'string' ? prod._id : 
                          (prod._id && prod._id.$oid) ? prod._id.$oid : 
                          prod.id || '';
                          
            return prodId !== id;
          });
          
          console.log(`Fetched ${filteredProducts.length} new arrivals products`);
          
          // Ensure products have valid IDs before setting state
          const processedProducts = filteredProducts.map((prod: any) => {
            if (!prod) return null;
            
            // Try to get the product ID from different possible locations
            const productId = typeof prod._id === 'string' ? prod._id : 
                             (prod._id && prod._id.$oid) ? prod._id.$oid : 
                             prod.id || '';
            
            // Add the extracted ID back to the product
            return {
              ...prod,
              _id: productId // Ensure _id is always a string
            };
          }).filter(Boolean); // Remove any null values
          
          setNewArrivals(processedProducts);
        } else {
          console.error(`Failed to fetch new arrivals: ${response.status}`);
          setNewArrivals([]);
        }
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
        setNewArrivals([]);
      } finally {
        setLoadingNewArrivals(false);
      }
    };
    
    fetchNewArrivals();
  }, [product, selectedSize]) // Only run on initial load or if selectedSize is cleared
  
  // Effect to adjust quantity if it exceeds available stock
  useEffect(() => {
    // Get current available stock
    const availableStock = getAvailableStock();
    
    // If quantity exceeds available stock, reduce it
    if (quantity > availableStock) {
      setQuantity(Math.max(1, availableStock));
    }
  }, [selectedSize, selectedColor, product]);

  // Helper function for aggressive stock refreshing after an order with multiple attempts
  const aggressiveStockRefresh = async (productId: string) => {
    console.log(`🔄 Starting aggressive stock refresh sequence for product ${productId}`);
    
    // Mark this product as recently ordered
    markProductAsRecentlyOrdered(productId);
    
    // Immediate refresh
    await refreshStockData(false, true);
    
    // Schedule additional refreshes with increasing delays
    setTimeout(async () => {
      console.log(`🔄 Second stock refresh attempt for product ${productId}`);
      await refreshStockData(false, true);
    }, 2000);
    
    setTimeout(async () => {
      console.log(`🔄 Third stock refresh attempt for product ${productId}`);
      await refreshStockData(false, true);
    }, 5000);
  };
  
  // Function to refresh stock data using the stockSync utility with retry logic and admin panel integration
  const refreshStockData = async (showMessage = false, afterOrder = false) => {
    // If this is an after-order refresh, log it for debugging
    if (afterOrder) {
      console.log(`🔥 Performing aggressive stock refresh after order for product ${product?._id}`);
    }
    if (product && product._id) {
      try {
        // Set refreshing state
        setRefreshing(true);
        setRefreshMessage('');
        
        console.log('Refreshing stock data for product:', product._id);
        
        // Implement retry logic for stock refresh
        let refreshSuccess = false;
        let refreshAttempts = 0;
        const MAX_REFRESH_ATTEMPTS = 3;
        let stockData = null;
        
        while (refreshAttempts < MAX_REFRESH_ATTEMPTS && !refreshSuccess) {
          try {
            console.log(`Attempting to refresh stock (attempt ${refreshAttempts + 1}/${MAX_REFRESH_ATTEMPTS})`);
            // Use the forceRefreshStock function from stockSync utility with afterOrder flag
            stockData = await forceRefreshStock(product._id, afterOrder);
            
            if (stockData && stockData.success) {
              refreshSuccess = true;
              console.log('Stock refresh successful:', stockData);
              break;
            } else {
              throw new Error(`Stock refresh failed: ${stockData?.message || 'Unknown error'}`);
            }
          } catch (refreshError) {
            refreshAttempts++;
            console.warn(`Stock refresh attempt ${refreshAttempts} failed:`, refreshError);
            
            if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
              // Wait before retrying (exponential backoff)
              const delay = Math.min(1000 * Math.pow(2, refreshAttempts - 1), 3000);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // Now fetch the latest product data regardless of refresh success
        // This provides a fallback mechanism if the stock refresh fails
        try {
          // Add cache busting parameter and no-cache headers
          const timestamp = Date.now();
          const afterOrderParam = afterOrder ? '&afterOrder=true' : '';
          const response = await fetch(`/api/products/${product._id}?_t=${timestamp}${afterOrderParam}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'X-Request-After-Order': afterOrder ? 'true' : 'false'
            }
          });
          
          // Check response headers to verify stock freshness
          const stockTimestamp = response.headers.get('X-Stock-Timestamp');
          if (stockTimestamp) {
            console.log('Stock last updated:', new Date(parseInt(stockTimestamp)));
          }
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.product) {
              // Save current size and color selection before processing new data
              const currentSize = selectedSize;
              const currentColor = selectedColor;
              
              // Process the updated product data
              processProductData(data.product);
              
              // Restore size selection if it still exists in the updated product
              if (currentSize) {
                const sizeExists = data.product.sizeVariants?.some((sv: any) => sv.size === currentSize);
                if (sizeExists) {
                  setSelectedSize(currentSize);
                  
                  // Try to restore color selection if the size still has this color
                  if (currentColor) {
                    const sizeVariant = data.product.sizeVariants?.find((sv: any) => sv.size === currentSize);
                    const colorExists = sizeVariant?.colorVariants?.some((cv: any) => cv.color === currentColor);
                    if (colorExists) {
                      setSelectedColor(currentColor);
                    }
                  }
                }
              }
              
              // Show appropriate success message
              if (showMessage) {
                setRefreshMessage(refreshSuccess 
                  ? 'Stock levels updated successfully!' 
                  : 'Stock levels refreshed from ADMIN.');
                // Clear message after 5 seconds
                setTimeout(() => setRefreshMessage(''), 5000);
              }
            } else {
              throw new Error('Invalid product data received');
            }
          } else {
            throw new Error(`Error fetching product: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('Error fetching updated product data:', fetchError);
          
          // Even if we can't fetch new data, we can still update the product with the stock data
          if (refreshSuccess && stockData && stockData.sizeVariants) {
            setProduct(prevProduct => {
              if (!prevProduct) return prevProduct;
              
              // Create a deep copy of the product
              const updatedProduct = {...prevProduct};
              
              // Update size variants with new stock data
              updatedProduct.sizeVariants = stockData.sizeVariants;
              
              return updatedProduct;
            });
            
            if (showMessage) {
              setRefreshMessage('Stock updated successfully!');
              setTimeout(() => setRefreshMessage(''), 5000);
            }
          } else if (showMessage) {
            setRefreshMessage('Could not update stock levels. Please try again later.');
            setTimeout(() => setRefreshMessage(''), 5000);
          }
        }
      } catch (error) {
        console.error('Unexpected error refreshing stock:', error);
        if (showMessage) {
          setRefreshMessage('Error updating stock. Please try again.');
          setTimeout(() => setRefreshMessage(''), 5000);
        }
      } finally {
        setRefreshing(false);
      }
    }
  };
  
  // Setup WebSocket connection for real-time stock updates
  useEffect(() => {
    if (product && product._id) {
      console.log('Setting up WebSocket connection for product:', product._id);
      
      try {
        // Connect to the WebSocket server with enhanced error handling
        const socket = io('https://eleveadmin.netlify.app', {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          extraHeaders: {
            'Origin': 'https://elevee.netlify.app'
          }
        });
        
        // Log connection events
        socket.on('connect', () => {
          console.log('WebSocket connected successfully with ID:', socket.id);
        });
        
        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          // Fall back to polling for stock updates
          console.log('Falling back to manual polling for stock updates');
        });
        
        // Listen for stock updates
        socket.on('stock:reduced', (data) => {
          console.log('Stock update received via WebSocket:', data);
          
          // If this update is for the current product
          if (data.productId === product._id) {
            console.log('Received real-time stock update via WebSocket for current product:', data);
            // Force refresh stock data when we receive a WebSocket notification
            refreshStockData(false, true);
            
            // Update the UI with new stock information if needed
            if (data.size && data.color && typeof data.stock !== 'undefined') {
              // Update specific size/color stock
              updateStockDisplay(data.size, data.color, data.stock);
            }
          }
        });
        
        // Test the connection by sending a ping
        setTimeout(() => {
          if (socket.connected) {
            console.log('WebSocket still connected after timeout');
          } else {
            console.log('WebSocket not connected after timeout, falling back to polling');
          }
        }, 5000);
        
        return () => {
          // Clean up socket connection
          console.log('Cleaning up WebSocket connection');
          socket.off('stock:reduced');
          socket.off('connect_error');
          socket.off('connect');
          socket.disconnect();
        };
      } catch (socketError) {
        console.error('Error setting up WebSocket:', socketError);
      }
    }
  }, [product?._id]);
  
  // Function to handle actual order placement and refresh the page
  const handleOrderPlacement = async () => {
    if (!product) return;
    
    console.log('Order placement detected, processing stock reduction');
    
    try {
      // Get any pending stock reductions from localStorage
      const pendingItemsJson = localStorage.getItem('pendingStockReduction');
      const pendingItems = pendingItemsJson ? JSON.parse(pendingItemsJson) : [];
      
      // Use only the pending items from localStorage
      // This is more reliable than trying to access current component state
      const allItems = [...pendingItems];
      
      if (allItems.length > 0) {
        console.log('Processing stock reduction for order placement:', allItems);
        
        // Use our own backend as a proxy to avoid CORS issues
        const orderId = `order_${Date.now()}`;
        
        // Make multiple attempts to ensure stock reduction succeeds
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;
        
        while (attempts < maxAttempts && !success) {
          attempts++;
          console.log(`Stock reduction attempt ${attempts} of ${maxAttempts}`);
          
          try {
            const response = await fetch(`/api/stock/reduce?afterOrder=true&orderId=${orderId}`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              body: JSON.stringify({ 
                items: allItems.map(item => ({
                  productId: item.productId,
                  size: item.size,
                  color: item.color || 'Default',
                  quantity: item.quantity || 1
                }))
              })
            });
            
            console.log('Order placement stock reduction response status:', response.status);
            
            if (response.ok) {
              const result = await response.json();
              console.log('Order placement stock reduction result:', result);
              success = true;
            } else {
              console.error(`Stock reduction attempt ${attempts} failed with status ${response.status}`);
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (attemptError) {
            console.error(`Error in stock reduction attempt ${attempts}:`, attemptError);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Clear pending stock reductions
        localStorage.removeItem('pendingStockReduction');
        
        // NOW is the appropriate time to force a page refresh
        console.log('Order placed successfully, forcing page refresh to get fresh stock data');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error processing order placement:', error);
    }
  };
  
  // Detect order placement from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderComplete = urlParams.get('orderComplete') === 'true';
    
    if (orderComplete && product) {
      console.log('Order completion detected from URL parameters');
      handleOrderPlacement();
      
      // Remove the query parameter
      window.history.replaceState({}, document.title, `/product/${product._id}`);
    }
  }, [product]);
  
  // Manual refresh function for stock as recommended by the admin developer
  const manualRefreshStock = async (productId: string) => {
    try {
      console.log(`🔄 Manual refresh for product ${productId}`);
      setRefreshing(true);
      setRefreshMessage('Refreshing stock data...');
      
      // Use our own backend as a proxy to avoid CORS issues
      const timestamp = Date.now();
      const randomValue = Math.random().toString(36).substring(2, 10);
      const response = await fetch(`/api/stock/sync?productId=${productId}&timestamp=${timestamp}&r=${randomValue}&forceRefresh=true`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fresh stock data received:', data);
        
        // Update the product with the fresh stock data
        if (product && data) {
          const updatedProduct = { ...product };
          
          // Update the stock information in the product
          if (data.sizes) {
            updatedProduct.sizes = data.sizes;
          }
          
          if (data.sizeVariants) {
            updatedProduct.sizeVariants = data.sizeVariants;
          }
          
          // Update the product state
          setProduct(updatedProduct);
          setRefreshMessage('Stock data updated successfully!');
          setTimeout(() => setRefreshMessage(''), 3000);
        }
      } else {
        console.error('Error refreshing stock:', await response.text());
        setRefreshMessage('Error updating stock. Please try again.');
        setTimeout(() => setRefreshMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error in manual refresh:', error);
      setRefreshMessage('Error updating stock. Please try again.');
      setTimeout(() => setRefreshMessage(''), 3000);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Function to call the admin panel's stock reduction API as specified by the admin developer
  const callAdminStockReductionApi = async (orderId: string, items: any[]) => {
    try {
      console.log(`Calling admin stock reduction API for order ${orderId}`);
      
      // Use our own backend as a proxy to avoid CORS issues
      const response = await fetch(`/api/stock/reduce?afterOrder=true&orderId=${orderId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ items })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Admin stock reduction result:', result);
        return result;
      } else {
        console.error('Admin stock reduction API returned error:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error calling admin stock reduction API:', error);
      return null;
    }
  };
  
  // Helper function to update stock display for specific size/color
  const updateStockDisplay = (size: string, color: string, stock: number) => {
    console.log(`Updating display for size: ${size}, color: ${color}, stock: ${stock}`);
    // Implementation would depend on how stock is stored in state
    if (product && product.sizeVariants) {
      // Create a deep copy of the current product
      const updatedProduct = JSON.parse(JSON.stringify(product));
      
      // Find and update the specific size/color combination
      for (const sizeVariant of updatedProduct.sizeVariants) {
        if (sizeVariant.size === size && sizeVariant.colorVariants) {
          for (const colorVariant of sizeVariant.colorVariants) {
            if (colorVariant.color === color) {
              colorVariant.stock = stock;
              console.log(`Updated stock for ${size}/${color} to ${stock}`);
              break;
            }
          }
        }
      }
      
      // Update the product state with the new stock information
      setProduct(updatedProduct);
      
      // If this is the currently selected size/color, update the UI immediately
      if (selectedSize === size && selectedColor === color) {
        // Force a re-render of the stock display
        setSelectedSize(size);
        setSelectedColor(color);
      }
    }
  };
  
  // Check for pending stock reductions on page load
  useEffect(() => {
    // Check if we're coming back from a pending reduction redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hasPendingReduction = urlParams.get('pendingReduction') === 'true';
    
    if (hasPendingReduction && product) {
      console.log('Found pending stock reduction, processing now...');
      
      try {
        // Get the pending items from local storage
        const pendingItemsJson = localStorage.getItem('pendingStockReduction');
        
        if (pendingItemsJson) {
          const pendingItems = JSON.parse(pendingItemsJson);
          
          if (pendingItems.length > 0) {
            console.log('Processing pending stock reduction for items:', pendingItems);
            
            // Use our own backend as a proxy to avoid CORS issues
            fetch('/api/stock/reduce?afterOrder=true', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              body: JSON.stringify({ items: pendingItems })
            })
            .then(response => {
              console.log('Pending reduction response status:', response.status);
              return response.json();
            })
            .then(data => {
              console.log('Pending stock reduction processed successfully:', data);
              // Clear the pending items from local storage
              localStorage.removeItem('pendingStockReduction');
              // Refresh the page without the query parameter
              window.history.replaceState({}, document.title, `/product/${product._id}`);
              // Force refresh stock data
              refreshStockData(true, true);
            })
            .catch(error => {
              console.error('Error processing pending stock reduction:', error);
            });
          }
        }
      } catch (error) {
        console.error('Error handling pending stock reduction:', error);
      }
    }
  }, [product]);
  
  // Initialize real-time stock synchronization
  useEffect(() => {
    if (product && product._id) {
      console.log('Initializing real-time stock sync for product:', product._id);
      
      // Initialize stock synchronization
      const cleanup = initStockSync(product._id, (stockData) => {
        console.log('Real-time stock update received:', stockData);
        
        // Save current selections before updating
        const currentSize = selectedSize;
        const currentColor = selectedColor;
        
        // Update the product with new stock information
        setProduct(prevProduct => {
          if (!prevProduct) return prevProduct;
          
          // Create a deep copy of the product
          const updatedProduct = {...prevProduct};
          
          // Update size variants with new stock data
          if (stockData.sizeVariants && Array.isArray(stockData.sizeVariants) && stockData.sizeVariants.length > 0) {
            console.log(`Updating product with ${stockData.sizeVariants.length} size variants`);
            updatedProduct.sizeVariants = stockData.sizeVariants;
            
            // Also update the simple sizes array for compatibility
            updatedProduct.sizes = stockData.sizeVariants.map((sv: any) => {
              // Calculate total stock across all colors for this size
              const totalStock = Array.isArray(sv.colorVariants) 
                ? sv.colorVariants.reduce((sum: number, cv: any) => sum + (cv.stock || 0), 0)
                : sv.stock || 0;
                
              return {
                size: sv.size,
                stock: totalStock,
                isPreOrder: totalStock <= 0 // Mark as pre-order if no stock
              };
            });
          }
          
          return updatedProduct;
        });
        
        // IMPORTANT: Do NOT reset the user's size selection during stock updates
        // We'll only update the color selection if needed, but keep the user's size choice
        if (currentSize && currentColor && product?.sizeVariants) {
          const sizeVariant = product.sizeVariants.find(sv => sv.size === currentSize);
          if (sizeVariant && sizeVariant.colorVariants) {
            const colorStillExists = sizeVariant.colorVariants.some(cv => cv.color === currentColor);
            if (!colorStillExists && sizeVariant.colorVariants.length > 0) {
              // Only update color if the current one no longer exists
              setSelectedColor(sizeVariant.colorVariants[0].color);
            }
          }
        }
      });
      
      // Also handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refreshStockData(false); // Refresh without showing message
        }
      };
      
      // Add event listener for page visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        // Clean up stock sync and event listener
        cleanup();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [product?._id]); // Only re-initialize when product ID changes

  // Helper function to process product data
  const processProductData = (data: any) => {
    try {
      console.log('Processing product data:', data);
      
      // Process images safely
      const productImages = []
      try {
        if (Array.isArray(data.selectedImages) && data.selectedImages.length > 0) {
          productImages.push(...data.selectedImages.map((img: string) => processImageUrl(img)))
        } else if (Array.isArray(data.images) && data.images.length > 0) {
          productImages.push(...data.images.map((img: string) => processImageUrl(img)))
        } else if (typeof data.image === 'string') {
          productImages.push(processImageUrl(data.image))
        }
      } catch (imgErr) {
        console.error('Error processing images:', imgErr)
      }
      
      // If no images were found, add a default image
      if (productImages.length === 0) {
        productImages.push('/images/try-image.jpg')
      }
      
      // Process sizes and size variants
      let productSizes = []
      let productSizeVariants = undefined
      
      try {
        // Check if we have sizeVariants in the data (admin panel format)
        if (data.sizeVariants && Array.isArray(data.sizeVariants) && data.sizeVariants.length > 0) {
          console.log('Found size variants in data:', data.sizeVariants);
          // Process size variants to ensure stock information is properly handled
          productSizeVariants = data.sizeVariants.map((sv: any) => {
            // Ensure each color variant has valid stock information
            let processedColorVariants = [];
            
            // Case 1: Size variant has color variants array
            if (Array.isArray(sv.colorVariants) && sv.colorVariants.length > 0) {
              processedColorVariants = sv.colorVariants.map((cv: any) => ({
                ...cv,
                color: cv.color || 'Default',
                stock: typeof cv.stock === 'number' ? cv.stock : 0,
                hexCode: cv.hexCode || '#000000'
              }));
            }
            // Case 2: Size variant has no color variants - create a default one
            else {
              // Create a default color variant with the size's stock
              processedColorVariants = [{
                color: 'Default',
                stock: typeof sv.stock === 'number' ? sv.stock : 0,
                hexCode: '#000000'
              }];
              console.log(`Created default color variant for size ${sv.size} with stock ${sv.stock}`);
            }
              
            return {
              ...sv,
              size: sv.size || 'One Size',
              colorVariants: processedColorVariants
            };
          });
          
          console.log('Processed size variants with stock information:', productSizeVariants);
          
          // Also create simple sizes array for compatibility
          productSizes = data.sizeVariants.map((sv: any) => {
            // Calculate total stock across all colors for this size
            const totalStock = Array.isArray(sv.colorVariants) 
              ? sv.colorVariants.reduce((sum: number, cv: any) => sum + (cv.stock || 0), 0)
              : 0;
              
            return {
              size: sv.size,
              stock: totalStock,
              isPreOrder: totalStock <= 0 // Mark as pre-order if no stock
            };
          });
        }
        // If no size variants but we have selectedSizes
        else if (Array.isArray(data.selectedSizes) && data.selectedSizes.length > 0) {
          productSizes = data.selectedSizes.map((size: string) => ({
            size,
            stock: 10, // Default stock value
            isPreOrder: false
          }));
        } 
        // If we have a sizes array
        else if (Array.isArray(data.sizes) && data.sizes.length > 0) {
          productSizes = data.sizes.map((sizeStock: any) => ({
            size: sizeStock.size || 'One Size',
            stock: typeof sizeStock.stock === 'number' ? sizeStock.stock : 10,
            isPreOrder: Boolean(sizeStock.isPreOrder)
          }));
        } 
        // Default fallback
        else {
          productSizes = [{ size: 'One Size', stock: 10, isPreOrder: false }];
        }
      } catch (sizeErr) {
        console.error('Error processing sizes:', sizeErr);
        productSizes = [{ size: 'One Size', stock: 10, isPreOrder: false }];
      }

      // Create the transformed product
      const transformedProduct: Product = {
        _id: data._id || data.id || id, // Support both _id and id fields, fallback to URL id
        name: data.title || data.name || 'Untitled Product',
        price: typeof data.price === 'number' ? data.price : 0,
        images: productImages,
        description: data.description || '',
        Material: Array.isArray(data.material) ? data.material : ['French linen'],
        sizes: productSizes,
        sizeVariants: productSizeVariants,
        discount: typeof data.discount === 'number' ? data.discount : 0,
        categories: Array.isArray(data.categories) ? data.categories : [],
        // Add the admin-controlled fields from the updated Product model
        materials: Array.isArray(data.materials) ? data.materials : [],
        sizeGuide: data.sizeGuide || '',
        packaging: data.packaging || '',
        shippingReturns: data.shippingReturns || '',
        gender: data.gender || '',
      }

      console.log('Transformed product:', transformedProduct)
      setProduct(transformedProduct)
      
      // If there's only one size, select it automatically
      if (productSizes.length > 0) {
        setSelectedSize(productSizes[0].size)
      }
    } catch (processError) {
      console.error('Error processing product data:', processError)
      throw new Error('Failed to process product data')
    }
  }

  // Fetch product data with retry logic and better admin panel integration
  // Load hard-coded sample products for NEW ARRIVALS
  const loadSampleNewArrivals = () => {
    setLoadingNewArrivals(true);
    try {
      // Create sample products directly
      const sampleProducts: Product[] = [
        {
          _id: "1",
          name: '01 Sage set in Rich brown',
          price: 1300,
          images: [
            '/images/try-image.jpg',
            '/images/try-image.jpg'
          ],
          description: 'Experience the perfect blend of luxury and ease with this Rich Brown French linen set.',
          Material: ['French linen'],
          sizes: [
            { size: 'S', stock: 10, isPreOrder: false },
            { size: 'M', stock: 10, isPreOrder: false },
            { size: 'L', stock: 10, isPreOrder: false }
          ],
          materials: ['French linen', 'Organic cotton', '100% sustainable'],
          sizeGuide: 'XS fits UK size 6-8<br>S fits UK size 8-10<br>M fits UK size 10-12<br>L fits UK size 12-14',
          packaging: 'Each item comes in an elegant eco-friendly Eleve branded box with tissue paper wrapping.',
          shippingReturns: '<ul><li>Free shipping on orders over 2000 EGP</li><li>Standard delivery: 3-5 business days</li><li>Express delivery available for an additional fee</li><li>Returns accepted within 3 days of delivery with original packaging</li></ul>'
        },
        {
          _id: "2",
          name: '02 Sage set in light beige',
          price: 1300,
          images: [
            '/images/try-image.jpg',
            '/images/try-image.jpg'
          ],
          description: 'Experience the perfect blend of luxury and ease with this light beige French linen set.',
          Material: ['French linen'],
          sizes: [
            { size: 'S', stock: 10, isPreOrder: false },
            { size: 'M', stock: 10, isPreOrder: false },
            { size: 'L', stock: 10, isPreOrder: false }
          ],
          materials: ['French linen']
        },
        {
          _id: "3",
          name: 'Sage top in Rich brown',
          price: 700,
          images: [
            '/images/try-image.jpg',
            '/images/try-image.jpg'
          ],
          description: 'Effortlessly chic and breathable, this Rich Brown French linen top.',
          Material: ['French linen'],
          sizes: [
            { size: 'S', stock: 10, isPreOrder: false },
            { size: 'M', stock: 10, isPreOrder: false },
            { size: 'L', stock: 10, isPreOrder: false }
          ],
          materials: ['French linen']
        },
        {
          _id: "4",
          name: 'Sage top in light beige',
          price: 700,
          images: [
            '/images/try-image.jpg',
            '/images/try-image.jpg'
          ],
          description: 'Effortlessly chic and breathable, this light beige French linen top.',
          Material: ['French linen'],
          sizes: [
            { size: 'S', stock: 10, isPreOrder: false },
            { size: 'M', stock: 10, isPreOrder: false },
            { size: 'L', stock: 10, isPreOrder: false }
          ],
          materials: ['French linen']
        }
      ];
      
      console.log('Using sample products for NEW ARRIVALS:', sampleProducts.length);
      setNewArrivals(sampleProducts);
    } catch (err) {
      console.error('Error loading sample products:', err);
      setNewArrivals([]); // Set empty array as fallback
    } finally {
      setLoadingNewArrivals(false);
    }
  };
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Reset selected size and color when product changes
        setSelectedSize('')
        setSelectedColor('')
        
        // Check if this product needs to be forcefully refreshed after an order
        if (typeof window !== 'undefined') {
          const productsToUpdateJson = sessionStorage.getItem('productsToUpdate');
          if (productsToUpdateJson) {
            try {
              const productsToUpdate = JSON.parse(productsToUpdateJson);
              // Check if the current product is in the list of products to update
              if (productsToUpdate?.ids?.includes(id)) {
                console.log(`Product ${id} needs a refresh after recent order`);
                setRefreshMessage('Updating product information...');
                // Force a refresh of stock data right now
                setTimeout(() => {
                  console.log('Forcing stock refresh after order completion');
                  refreshStockData(true, true); // Force refresh with visual feedback
                }, 500);
                // Clear the update flag
                sessionStorage.removeItem('productsToUpdate');
              }
            } catch (parseError) {
              console.error('Error parsing products to update:', parseError);
            }
          }
        }
        
        console.log('Fetching product with ID:', id)
        
        // Implement retry logic for product fetching
        let fetchAttempts = 0;
        const MAX_FETCH_ATTEMPTS = 3;
        let productData = null;
        let fetchError = null;
        
        // Try to fetch from our API with retries
        while (fetchAttempts < MAX_FETCH_ATTEMPTS && !productData) {
          try {
            console.log(`Fetching product data (attempt ${fetchAttempts + 1}/${MAX_FETCH_ATTEMPTS})`);
            
            // Add cache busting parameter and no-cache headers
            const response = await fetch(`/api/products/${id}?_t=${Date.now()}`, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            });
            
            if (!response.ok) {
              throw new Error(`API returned status ${response.status}`);
            }

            const data = await response.json();
            console.log('Received product data:', JSON.stringify(data, null, 2));
            
            // Log specific stock information for debugging
            if (data && (data.product || data)) {
              const productInfo = data.product || data;
              console.log('Product size variants:', JSON.stringify(productInfo.sizeVariants, null, 2));
              
              // Check if size variants have color variants with stock
              if (productInfo.sizeVariants && Array.isArray(productInfo.sizeVariants)) {
                productInfo.sizeVariants.forEach((sv: any, i: number) => {
                  console.log(`Size variant ${i} (${sv.size}):`, sv);
                  if (sv.colorVariants && Array.isArray(sv.colorVariants)) {
                    sv.colorVariants.forEach((cv: any, j: number) => {
                      console.log(`  Color variant ${j} (${cv.color}):`, cv);
                      console.log(`  Stock value: ${cv.stock} (type: ${typeof cv.stock})`);
                    });
                  }
                });
              }
              
              productData = productInfo;
              break; // Success, exit retry loop
            } else {
              throw new Error('Invalid product data received');
            }
          } catch (error) {
            fetchError = error;
            fetchAttempts++;
            console.warn(`Fetch attempt ${fetchAttempts} failed:`, error);
            
            if (fetchAttempts < MAX_FETCH_ATTEMPTS) {
              // Wait before retrying (exponential backoff)
              const delay = Math.min(1000 * Math.pow(2, fetchAttempts - 1), 5000);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        if (productData) {
          // Process product data
          processProductData(productData);
          console.log('Successfully processed product data');
        } else {
          console.error('All fetch attempts failed:', fetchError);
          
          // If we're here, the API fetch failed, try local data
          console.log('Falling back to local data');
          
          // Create a placeholder product
          const placeholderProduct: Product = {
            _id: id,
            name: 'Product ' + id,
            price: 0,
            images: ['/images/model-image.jpg'],
            description: 'Product description not available.',
            Material: ['Unknown'],
            sizes: [{ size: 'One Size', stock: 10, isPreOrder: false }]
          }
          
          setProduct(placeholderProduct)
          setSelectedSize(placeholderProduct.sizes[0].size)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    // Call the fetchProduct function
    fetchProduct();
    // Load new arrivals from sample data
    loadSampleNewArrivals();
  }, [id])

  // Add to cart function with stock validation - NEVER reduces stock (only done after checkout)
  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    // If product has sizeVariants and colors are available, require color selection
    if (product.sizeVariants && availableColors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }
    
    // Get current available stock
    const availableStock = getAvailableStock();
    
    // Validate stock one more time before adding to cart
    if (quantity > availableStock) {
      // Adjust quantity to match available stock
      setQuantity(availableStock);
      
      // No longer showing out-of-stock messages
      
      alert(`Please note that we've adjusted your quantity.`);
    }
    
    // Create cart item
    const cartItem: CartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: Math.min(quantity, availableStock), // Ensure we don't exceed available stock
      size: selectedSize,
      color: selectedColor || undefined,
      image: product.images[0],
      discount: product.discount,
      _stockInfo: {
        originalStock: availableStock,
        size: selectedSize,
        color: selectedColor || ''
      }
    };
    
    try {
      // Try to validate stock with the server before adding to cart
      const response = await fetch('/api/stock/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            productId: product._id,
            size: selectedSize,
            color: selectedColor || undefined,
            quantity: Math.min(quantity, availableStock)
          }]
        })
      });
      
      const result = await response.json();
      
      if (!result.valid) {
        // If server says stock is not valid, refresh stock and show error
        refreshStockData(false);
        alert(`Stock issue: ${result.message}. The page will refresh with updated stock information.`);
        return;
      }
      
      // Stock is valid, add to cart
      addToCart(cartItem);
      
      // Show added animation
      setShowAddedAnimation(true);
      setTimeout(() => setShowAddedAnimation(false), 2000);
      
      // Mark this product as recently ordered for better real-time updates
      markProductAsRecentlyOrdered(product._id);
      
      // Log successful cart addition
      console.log('Item added to cart successfully - NO STOCK REDUCTION until checkout');
      
      // Refresh stock data in background without showing message to user
      refreshStockData(false, false);
      
    } catch (error) {
      console.error('Error validating stock:', error);
      
      // If server validation fails, still add to cart
      addToCart(cartItem);
      setShowAddedAnimation(true);
      setTimeout(() => setShowAddedAnimation(false), 2000);
      
      // Mark this product as recently ordered
      if (product) {
        markProductAsRecentlyOrdered(product._id);
      }
      
      // Refresh stock data in background
      refreshStockData(false, false);
    }
  }

  // Add a function to handle image navigation
  const nextImage = () => {
    if (product && product.images && product.images.length > 1) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
      
      // Scroll to the next image in the scrollable container
      const scrollableContainer = document.querySelector('.scrollable-x');
      if (scrollableContainer) {
        const nextIndex = (currentImageIndex + 1) % product.images.length;
        const nextImageWidth = scrollableContainer.clientWidth;
        scrollableContainer.scrollTo({
          left: nextIndex * nextImageWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
        <NewFooter />
      </>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-xl">
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/collection" className="text-black underline">
              Return to Collection
            </Link>
          </div>
        </div>
        <NewFooter />
      </>
    )
  }

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Collection', href: '/collection' },
    { label: product.name, href: pathname }
  ]

  // We're hiding stock status
  const isSoldOut: boolean = isProductSoldOut();

  // Calculate price with discount
  const finalPrice = product.discount 
    ? product.price - (product.price * product.discount / 100) 
    : product.price;

  return (
    <>
      <Nav />
      
      {/* Added to Cart Animation */}
      <AnimatePresence>
        {showAddedAnimation && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-lg z-50"
          >
            Added to cart!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-white dark:bg-black pt-20 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Mobile: Images First */}
          <div className="w-full order-first lg:order-2 lg:w-1/3 flex flex-col items-center justify-center mb-8 lg:mb-0 relative">
            <div className="w-full overflow-x-auto scrollable-x snap-x snap-mandatory">
              <div className="flex">
                {product.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 w-full snap-center"
                    style={{ minWidth: '100%' }}
                  >
                    <div className="relative w-full max-w-[400px] aspect-[3/4] mx-auto">
                      <Image
                        src={optimizeCloudinaryUrl(img, { width: 800 })}
                        alt={`${product.name} - View ${idx + 1}`}
                        fill
                        className="object-contain"
                        priority={idx === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Image indicators - small circles */}
            {product.images.length > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {product.images.map((_, index) => (
                  <div 
                    key={`indicator-${index}`}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-all ${currentImageIndex === index ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      const scrollableContainer = document.querySelector('.scrollable-x');
                      if (scrollableContainer) {
                        const imageWidth = scrollableContainer.clientWidth;
                        scrollableContainer.scrollTo({
                          left: index * imageWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Right arrow indicator for multiple images - now clickable */}
            {product.images.length > 1 && (
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-full p-2 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer z-10"
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

            {/* Left: Info Card with Accordion */}
            <div className="w-full order-2 lg:order-1 lg:w-1/3 p-8 text-left flex flex-col items-center justify-center" style={{ minWidth: 320 }}>
              <div className="w-full">
                <div className="text-xs tracking-widest mb-2 text-gray-500 dark:text-gray-400 text-center">{product.name.toUpperCase()}</div>
                <div className="text-xl font-light mb-4 text-center text-black dark:text-white">{product.title || product.name}</div>
                
                {/* Status message */}
                {refreshMessage && (
                  <div className="bg-green-50 text-green-700 p-2 mb-4 text-sm rounded text-center">
                    Product information updated!
                  </div>
                )}

                {/* Gender information if available */}
                {product.gender && (
                  <div className="mb-4 flex justify-center">
                    <div className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      {product.gender}
                    </div>
                  </div>
                )}
                
                {/* Accordion Sections */}
                <div className="space-y-1">
                  {[
                    {
                      title: "DESCRIPTION",
                      content: product.description
                    },
                    {
                      title: "SIZE GUIDE",
                      content: (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {/* Use the admin-provided size guide if available, otherwise show default content */}
                          {product.sizeGuide 
                            ? <div dangerouslySetInnerHTML={{ __html: product.sizeGuide }} />
                            : <>
                                <p>XS fits from 45 to 50 kgs</p>
                                <p>Small fits from 50 to 58 kgs</p>
                                <p>Medium from 59 to 70 kgs</p>
                                <p>Large from 71 to 80 kgs</p>
                              </>
                          }
                        </div>
                      )
                    },
                    {
                      title: "PACKAGING",
                      content: (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {/* Use the admin-provided packaging info if available, otherwise show default content */}
                          {product.packaging 
                            ? <div dangerouslySetInnerHTML={{ __html: product.packaging }} />
                            : "All items are carefully packaged to ensure they arrive in perfect condition."
                          }
                        </div>
                      )
                    },
                    {
                      title: "SHIPPING & RETURNS",
                      content: (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {/* Use the admin-provided shipping & returns info if available, otherwise show default content */}
                          {product.shippingReturns 
                            ? <div dangerouslySetInnerHTML={{ __html: product.shippingReturns }} />
                            : <ul className="list-disc pl-4 space-y-2">
                                <li>Shipping in 3-7 days</li>
                                <li><strong>On-the-Spot Trying:</strong> Customers have the ability to try on the item while the courier is present at the time of delivery.</li>
                                <li><strong>Immediate Return Requirement:</strong> If the customer is not satisfied, they must return the item immediately to the courier. Once the courier leaves, the item is considered accepted, and no returns or refunds will be processed.</li>
                                <li><strong>Condition of Return:</strong> The item must be undamaged, and in its original packaging for a successful return.</li>
                                <li><strong>No Returns After Courier Departure:</strong> After the courier has left, all sales are final, and no returns, exchanges, or refunds will be accepted.</li>
                              </ul>
                          }
                        </div>
                      )
                    }
                  ].map((section, index) => (
                    <div
                      key={section.title}
                      className="border-b border-stone-200 dark:border-stone-700 last:border-b-0 relative isolate group/faq cursor-pointer"
                      onClick={() => setSelectedSection(selectedSection === index ? null : index)}
                    >
                      <div className={twMerge(
                        "flex items-center justify-between gap-4 py-4 transition-all group-hover/faq:px-4 text-black dark:text-white",
                        selectedSection === index && "px-4"
                      )}>
                        <div className="text-base font-medium">{section.title}</div>
                        <div className={twMerge(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full transition duration-300",
                          selectedSection === index ? "rotate-45" : ""
                        )}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                        </div>
                      </div>
                      <AnimatePresence>
                        {selectedSection === index && (
                          <motion.div
                            className="overflow-hidden px-4"
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                          >
                            <div className="pb-4 text-sm text-gray-600 dark:text-gray-300">
                              {section.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Size/Order Box */}
            <div className="w-full order-3 lg:order-3 lg:w-1/3 p-8 flex flex-col gap-6 items-center justify-center" style={{ minWidth: 320 }}>
              <div className="w-full flex flex-col items-center">
                <div className="text-xs font-semibold mb-2 text-center text-black dark:text-white">SIZE</div>
                <div className="flex flex-wrap gap-3 mb-4 justify-center">
                  {(product.sizeVariants && Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) ? (
                    product.sizeVariants.map((sizeVariant) => {

                        
                      return (
                        <button
                          key={sizeVariant.size}
                          type="button"
                          onClick={() => setSelectedSize(sizeVariant.size)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm transition-colors
                            ${selectedSize === sizeVariant.size 
                              ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                              : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                            }`}
                        >
                          {sizeVariant.size}
                        </button>
                      );
                    })
                  ) : (
                    // Only use sizes from the API, no fallback
                    (product?.sizes && product.sizes.length > 0 ? product.sizes : []).map((sizeOption) => (
                      <button
                        key={sizeOption.size}
                        type="button"
                        onClick={() => setSelectedSize(sizeOption.size)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm transition-colors
                          ${selectedSize === sizeOption.size 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                            : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                          }`}
                      >
                        {sizeOption.size}
                      </button>
                    ))
                  )}
                </div>

                {/* Display color options if variants exist */}
                {product.sizeVariants && selectedSize && availableColors.length > 0 && (
                  <>
                    <div className="text-xs font-semibold mb-2 text-center text-black dark:text-white">COLOR</div>
                    <div className="flex flex-wrap gap-3 mb-4 justify-center">
                      {availableColors.map((colorVariant) => (
                        <button
                          key={colorVariant.color}
                          onClick={() => setSelectedColor(colorVariant.color)}
                          className={`relative flex items-center justify-center px-4 py-2 text-sm transition-colors
                            ${selectedColor === colorVariant.color 
                              ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                              : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                            }`}
                        >
                          <div className="flex items-center justify-center w-full">
                            <span className="mr-1">{colorVariant.color}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                

                
                {/* Quantity Selector */}
                {selectedSize && selectedColor && (
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center border border-gray-300">
                      <button 
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 text-lg border-r border-gray-300 hover:bg-gray-100"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-1">{quantity}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setQuantity(quantity + 1);
                        }}
                        className="px-3 py-1 text-lg border-l border-gray-300 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Price and Pre-order badge beside size */}
                <div className="flex items-center gap-4 mb-4 justify-center">
                  <span className="text-lg font-medium text-black dark:text-white">
                    L.E {product.discount ? finalPrice.toFixed(2) : product.price.toFixed(2)}
                  </span>
                  {product.discount && (
                    <span className="text-sm line-through text-gray-500 dark:text-gray-400">
                      L.E {product.price.toFixed(2)}
                    </span>
                  )}

                </div>
            
                {/* Add to cart section */}
                <div className="flex flex-col gap-0 w-full border border-[#0F1824] mb-4">
                  <button
                    type="button"
                    onClick={handleAddToCartClick}
                    className={`w-full py-4 text-sm font-medium transition-colors ${
                      isSoldOut || isSelectedVariantSoldOut()
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-[#0F1824] text-white active:bg-black'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                    disabled={!selectedSize || (product.sizeVariants && !selectedColor) || isSoldOut || isSelectedVariantSoldOut()}
                  >
                    {isSoldOut || isSelectedVariantSoldOut() ? 'SOLD OUT' : 'ADD TO CART'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNowClick}
                    className={`w-full py-4 text-sm font-medium transition-colors ${
                      isSoldOut || isSelectedVariantSoldOut()
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-black active:bg-[#0F1824] active:text-white'
                    } disabled:bg-gray-200 disabled:cursor-not-allowed`}
                    disabled={!selectedSize || (product.sizeVariants && !selectedColor) || isSoldOut || isSelectedVariantSoldOut()}
                  >
                    {isSoldOut || isSelectedVariantSoldOut() ? 'SOLD OUT' : 'BUY IT NOW'}
                  </button>
                </div>
                
                {/* Selection Instructions */}
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {isSoldOut 
                    ? 'This product is currently sold out'
                    : isSelectedVariantSoldOut()
                    ? 'Selected size/color is sold out'
                    : (!selectedSize || (product.sizeVariants && !selectedColor))
                    ? 'Please select a size and color'
                    : 'Ready to add to cart'
                  }
                </div>

              </div>
            </div>
          </div>
        </div>
      

    <NewArrivals />
      
      <NewFooter />
    </>
  )
}

export default ProductPage
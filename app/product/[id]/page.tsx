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
      if (sizeVariant && sizeVariant.colorVariants) {
        // Find the selected color variant
        const colorVariant = sizeVariant.colorVariants.find(cv => cv.color === selectedColor);
        if (colorVariant) {
          // Return the actual stock for this size/color combination
          return colorVariant.stock;
        }
      }
    }
    
    // If using size variants but no color selected
    if (product.sizeVariants && selectedSize) {
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize);
      if (sizeVariant && sizeVariant.colorVariants) {
        // Calculate total stock across all colors for this size
        return sizeVariant.colorVariants.reduce((sum, cv) => sum + cv.stock, 0);
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
  
  // Effect to update available colors when size changes
  useEffect(() => {
    if (product && product.sizeVariants && selectedSize) {
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize)
      if (sizeVariant) {
        setAvailableColors(sizeVariant.colorVariants)
        // Auto-select first color if available
        if (sizeVariant.colorVariants.length > 0 && !selectedColor) {
          setSelectedColor(sizeVariant.colorVariants[0].color)
        }
      } else {
        setAvailableColors([])
      }
    } else {
      setAvailableColors([])
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
        const socket = io('https://kleankutsadmin.netlify.app', {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          extraHeaders: {
            'Origin': 'https://kleankuts.shop'
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
        productImages.push('/images/model-image.jpg')
      }
      
      // Process sizes and size variants
      let productSizes = []
      let productSizeVariants = undefined
      
      try {
        // Check if we have sizeVariants in the data (admin panel format)
        if (data.sizeVariants && Array.isArray(data.sizeVariants) && data.sizeVariants.length > 0) {
          console.log('Found size variants in data:', data.sizeVariants);
          // Use the exact size variants from the admin panel without modification
          productSizeVariants = JSON.parse(JSON.stringify(data.sizeVariants));
          console.log('Using exact size variants from admin panel:', productSizeVariants);
          
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
        categories: Array.isArray(data.categories) ? data.categories : []
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
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError('')
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
            console.log('Received product data:', data);
            
            if (data && (data.product || data)) {
              productData = data.product || data;
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

    fetchProduct()
  }, [id])

  // Add to cart function with stock validation
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
      
      if (availableStock <= 0) {
        alert('Sorry, this item is out of stock.');
        return;
      }
      
      alert(`Only ${availableStock} items available. We've adjusted your quantity.`);
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
      
      console.log('Calling stock reduction API through proxy');
      
      // Use our backend as a proxy to avoid CORS issues
      try {
        // Prepare the request payload for logging
        const requestPayload = {
          items: [{
            productId: product._id,
            size: selectedSize,
            color: selectedColor || undefined,
            quantity: Math.min(quantity, availableStock)
          }]
        };
        
        console.log('Stock reduction request payload:', JSON.stringify(requestPayload));
        
        // Generate a unique order ID
        const orderId = `order_${Date.now()}`;
        
        // Call our API which will proxy the request to the admin panel
        const stockReduceResponse = await fetch(`/api/stock/reduce?afterOrder=true&orderId=${orderId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify(requestPayload)
        });
        
        console.log('Response status:', stockReduceResponse.status);
        
        const result = await stockReduceResponse.json();
        console.log('Stock reduction response data:', result);
        
        // Don't force page refresh after adding to cart
        // Only refresh after actual order placement
        console.log('Item added to cart successfully, stock reduction API called');
        // The page will only refresh after the actual order is placed, not just when adding to cart
      } catch (reduceError) {
        console.error('CRITICAL ERROR in stock reduction:', reduceError);
        // Log the exact request that failed
        console.error('Failed request body:', JSON.stringify({
          items: [{
            productId: product._id,
            size: selectedSize,
            color: selectedColor || undefined,
            quantity: Math.min(quantity, availableStock)
          }]
        }));
        
        // Implement fallback approach as recommended by admin developer
        try {
          console.log('Implementing fallback approach for stock reduction');
          
          // Store the order in local storage
          const orderItems = [{
            productId: product._id,
            size: selectedSize,
            color: selectedColor || undefined,
            quantity: Math.min(quantity, availableStock)
          }];
          
          localStorage.setItem('pendingStockReduction', JSON.stringify(orderItems));
          
          // Store the pending reduction but don't redirect immediately
          console.log('Stored pending stock reduction in localStorage');
          // The actual reduction will happen after order placement, not just when adding to cart
        } catch (fallbackError) {
          console.error('Error implementing fallback approach:', fallbackError);
        }
      }
      
      // Refresh stock data in the background with afterOrder flag for real-time updates
      refreshStockData(false, true);
    } catch (error) {
      console.error('Error validating stock:', error);
      // If server validation fails, still add to cart but refresh stock
      addToCart(cartItem);
      setShowAddedAnimation(true);
      setTimeout(() => setShowAddedAnimation(false), 2000);
      
      // Mark this product as recently ordered for better real-time updates
      markProductAsRecentlyOrdered(product._id);
      
      // CRITICAL FIX: Call the admin panel's stock reduction API directly as recommended
      console.log('Before stock reduction API call to admin panel (error recovery path)');
      try {
        // Call the admin panel's stock reduction API directly
        const adminStockReduceResponse = await fetch('https://kleankutsadmin.netlify.app/api/stock/reduce', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
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
        
        const adminResult = await adminStockReduceResponse.json();
        console.log('After stock reduction API call (error recovery):', adminResult);
        
        // Also call our local API for redundancy
        const orderId = `order_${Date.now()}`;
        const localStockReduceResponse = await fetch(`/api/stock/reduce?afterOrder=true&orderId=${orderId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              productId: product._id,
              size: selectedSize,
              color: selectedColor || undefined,
              quantity: Math.min(quantity, availableStock)
            }]
          })
        });
        
        // Don't force page refresh after adding to cart in error recovery path
        console.log('Item added to cart successfully in error recovery path, stock reduction API called');
        // The page will only refresh after the actual order is placed, not just when adding to cart
      } catch (reduceError) {
        console.error('Error reducing stock (error recovery):', reduceError);
      }
      
      // Refresh stock data in the background with afterOrder flag for real-time updates
      refreshStockData(false, true);
    }
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
        <Footer />
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
        <Footer />
      </>
    )
  }

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Collection', href: '/collection' },
    { label: product.name, href: pathname }
  ]

  // Check if product is sold out
  const isSoldOut = product.sizes.every(size => 
    (typeof size.stock === 'number' && size.stock <= 0) || 
    size.isPreOrder === true
  )

  // Calculate price with discount
  const finalPrice = product.discount 
    ? product.price - (product.price * product.discount / 100) 
    : product.price

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

      <main className="min-h-screen bg-white pt-20">
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <span>/</span>}
              <Link href={crumb.href} className="hover:text-gray-800">
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Product Info */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left - Images */}
            <div className="w-full lg:w-2/3">
              {/* Mobile Image Scroll */}
              <div className="block lg:hidden">
                <div className="relative w-full overflow-x-auto hide-scrollbar">
                  <div className="flex space-x-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="flex-none w-[85vw] relative aspect-[4/5]">
                        {/* SOLD OUT Badge */}
                        {isSoldOut && index === 0 && (
                          <div className="absolute top-3 right-3 z-20 bg-black text-white px-4 py-2 text-sm font-semibold rounded">
                            SOLD OUT
                          </div>
                        )}
                        <Image
                          src={optimizeCloudinaryUrl(image, { width: 600 })}
                          alt={`${product.name} - View ${index + 1}`}
                          fill
                          className="object-cover"
                          priority={index === 0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Image Stack */}
              <div className="hidden lg:flex flex-col space-y-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative aspect-[4/5] w-full">
                    {/* SOLD OUT Badge */}
                    {isSoldOut && index === 0 && (
                      <div className="absolute top-3 right-3 z-20 bg-black text-white px-4 py-2 text-sm font-semibold rounded">
                        SOLD OUT
                      </div>
                    )}
                    <Image
                      src={optimizeCloudinaryUrl(image, { width: 1200 })}
                      alt={`${product.name} - View ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Product Details */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-24 space-y-8">
                {/* Product Title & Price */}
                <div className="space-y-4">
                  <h1 className="text-4xl font-light mb-2">{product.name}</h1>
                  
                  {/* Price and refresh button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {product.discount ? (
                        <>
                          <p className="text-xl">L.E {finalPrice.toFixed(2)}</p>
                          <p className="text-sm text-gray-500 line-through">L.E {product.price.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-xl">L.E {product.price.toFixed(2)}</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => product && manualRefreshStock(product._id)} 
                      disabled={refreshing}
                      className="text-sm text-gray-600 flex items-center hover:text-black transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {refreshing ? 'Updating...' : 'Refresh stock'}
                    </button>
                  </div>
                  
                  {/* Stock refresh message */}
                  {refreshMessage && (
                    <div className="bg-green-50 text-green-700 p-2 mb-4 text-sm rounded">
                      {refreshMessage}
                    </div>
                  )}
                </div>

                {/* Size Selection */}
                <div className="mb-6 border-t border-b border-gray-200 py-4 my-4">
                  <h2 className="text-sm font-medium mb-3">Size</h2>
                  <div className="flex flex-wrap gap-3">
                    {/* Display only real sizes from admin panel */}
                    <div className="grid grid-cols-4 gap-2 w-full">
                      {(product.sizeVariants && Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) ? (
                        product.sizeVariants.map((sizeVariant) => {
                          // Calculate total stock for this size
                          const totalStock = Array.isArray(sizeVariant.colorVariants) 
                            ? sizeVariant.colorVariants.reduce((sum, cv) => sum + (cv.stock || 0), 0)
                            : 0;
                            
                          return (
                            <button
                              key={sizeVariant.size}
                              type="button"
                              onClick={() => setSelectedSize(sizeVariant.size)}
                              className={`px-4 py-2 border text-center relative ${selectedSize === sizeVariant.size ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-500'}`}
                            >
                              {sizeVariant.size}
                              {totalStock > 0 && totalStock <= 5 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                                  {totalStock}
                                </span>
                              )}
                              {totalStock > 5 && (
                                <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs px-1 rounded-full">
                                  {totalStock}
                                </span>
                              )}
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
                            className={`px-4 py-2 border text-center relative ${selectedSize === sizeOption.size ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-500'} ${sizeOption.stock <= 0 && !sizeOption.isPreOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={sizeOption.stock <= 0 && !sizeOption.isPreOrder}
                          >
                            {sizeOption.size}
                            {sizeOption.stock > 0 && sizeOption.stock <= 5 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                                {sizeOption.stock}
                              </span>
                            )}
                            {sizeOption.stock > 5 && (
                              <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs px-1 rounded-full">
                                {sizeOption.stock}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Color Selection - Only show if sizeVariants exist and a size is selected */}
                {product.sizeVariants && selectedSize && availableColors.length > 0 && (
// ...
                  <div className="mt-6">
                    <h2 className="text-sm font-medium mb-2">Color</h2>
                    <div className="flex flex-wrap gap-4">
                      {availableColors.map((colorVariant) => (
                        <button
                          key={colorVariant.color}
                          onClick={() => setSelectedColor(colorVariant.color)}
                          disabled={colorVariant.stock === 0}
                          className={`relative px-4 py-2 border flex items-center gap-2 ${
                            colorVariant.stock === 0 ? 'border-gray-300 text-gray-300 cursor-not-allowed' : 
                            selectedColor === colorVariant.color ? 'border-black bg-black text-white' : 'border-gray-400 hover:border-black'}`}
                        >
                          {colorVariant.hexCode && (
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: colorVariant.hexCode }}
                            />
                          )}
                          {colorVariant.color}
                          {/* Always show stock count with more emphasis */}
                          <span className={`ml-1 text-xs font-bold ${selectedColor === colorVariant.color ? 'text-white' : colorVariant.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                            ({colorVariant.stock} left)
                          </span>
                          {/* Low stock warning badge */}
                          {colorVariant.stock > 0 && colorVariant.stock <= 5 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                              {colorVariant.stock}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector with Stock Indicator */}
                <div className="flex items-center mt-4">
                  <span className="mr-4 font-medium">Quantity</span>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-3 py-1">{quantity}</span>
                    <button
                      onClick={() => {
                        // Get current available stock for selected size and color
                        const availableStock = getAvailableStock();
                        // Only increment if below available stock
                        if (quantity < availableStock) {
                          setQuantity(quantity + 1);
                        }
                      }}
                      disabled={quantity >= getAvailableStock()}
                      className={`px-3 py-1 focus:outline-none ${
                        quantity >= getAvailableStock()
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Stock Indicator */}
                  <div className="ml-4 text-sm">
                    {getAvailableStock() > 0 ? (
                      <span className={`${getAvailableStock() <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
                        {getAvailableStock() <= 5 ? 'Only ' : ''}
                        {getAvailableStock()} {getAvailableStock() === 1 ? 'item' : 'items'} left
                      </span>
                    ) : (
                      <span className="text-red-600">Out of stock</span>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isSoldOut || !selectedSize}
                  className={`w-full py-3 px-4 ${
                    isSoldOut || !selectedSize
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </button>

                {/* Product Description */}
                <div className="space-y-4 pt-8 border-t">
                  <div className="space-y-1">
                    {[
                      {
                        title: "DESCRIPTION",
                        content: product.description
                      },
                      {
                        title: "SHIPPING & RETURNS",
                        content: (
                          <ul className="list-disc pl-4 space-y-3 text-sm text-gray-600">
                            <li>Shipping in 3-7 days</li>
                            <li><strong>On-the-Spot Trying:</strong> Customers have the ability to try on the item while the courier is present at the time of delivery.</li>
                            <li><strong>Immediate Return Requirement:</strong> If the customer is not satisfied, they must return the item immediately to the courier. Once the courier leaves, the item is considered accepted, and no returns or refunds will be processed.</li>
                            <li><strong>Condition of Return:</strong> The item must be undamaged, and in its original packaging for a successful return.</li>
                            <li><strong>No Returns After Courier Departure:</strong> After the courier has left, all sales are final, and no returns, exchanges, or refunds will be accepted.</li>
                          </ul>
                        )
                      },
                      {
                        title: "MATERIAL",
                        content: (
                          <ul className="list-disc pl-4 space-y-2">
                            <li>French linen</li>
                          </ul>
                        )
                      },
                      {
                        title: "SIZE GUIDE",
                        content: (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">XS fits from 45 to 50 kgs</p>
                            <p className="text-sm text-gray-600">Small fits from 50 to 58 kgs</p>
                            <p className="text-sm text-gray-600">Medium from 59 to 70 kgs</p>
                            <p className="text-sm text-gray-600">Large from 71 to 80 kgs</p>
                          </div>
                        )
                      }
                    ].map((section, index) => (
                      <div
                        key={section.title}
                        className="border-b border-stone-200 last:border-b-0 relative isolate group/faq"
                        onClick={() => {
                          if (index === selectedSection) {
                            setSelectedSection(null);
                          } else {
                            setSelectedSection(index);
                          }
                        }}
                      >
                        <div className={twMerge(
                          "absolute h-0 w-full bottom-0 left-0 bg-stone-50 -z-10 group-hover/faq:h-full transition-all duration-700",
                          index === selectedSection && "h-full"
                        )}></div>
                        <div className={twMerge(
                          "flex items-center justify-between gap-4 py-4 cursor-pointer transition-all duration-500 group-hover/faq:px-4",
                          index === selectedSection && "px-4"
                        )}>
                          <div className="text-base font-medium">{section.title}</div>
                          <div className={twMerge(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full transition duration-300",
                            index === selectedSection ? "rotate-45" : ""
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
                          {index === selectedSection && (
                            <motion.div
                              className="overflow-hidden px-4"
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                            >
                              <div className="pb-4 text-sm text-gray-600">
                                {section.content}
                              </div>

                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Share */}
                <div className="pt-8 border-t">
                  <p className="mb-4">Share</p>
                  <div className="flex gap-4">
                    <Link href="mailto:kenzyzayed04@gmail.com" className="text-gray-600 hover:text-black">
                      Gmail
                    </Link>
                    <Link href="https://www.instagram.com/kleankuts_?igsh=MWJiaG40ZDVubDVhNA==" className="text-gray-600 hover:text-black">
                     Instagram
                    </Link>
                    <Link href="https://www.tiktok.com/@kleankuts?_t=ZS-8viW6yr2prk&_r=1" className="text-gray-600 hover:text-black">
                     Tiktok
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}

export default ProductPage
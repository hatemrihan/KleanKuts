'use client';

import React, { createContext, useContext, useState } from 'react';
import { updateInventoryAfterPurchase, checkProductStock } from '../utils/inventory';

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

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  itemCount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size: string, color?: string) => void;
  updateQuantity: (id: string, size: string, quantity: number, color?: string) => void;
  clearCart: () => void;
  checkoutCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const cartTotal = cart.reduce((total, item) => {
    const price = item.discount 
      ? item.price * (1 - item.discount/100) 
      : item.price;
    return total + (price * item.quantity);
  }, 0);

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      // Check if the item with the same ID, size, AND color exists
      const existingItem = prev.find(i => 
        i.id === item.id && 
        i.size === item.size && 
        i.color === item.color
      );
      
      if (existingItem) {
        return prev.map(i => 
          i.id === item.id && i.size === item.size && i.color === item.color
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
    
    // Optionally check stock availability (async)
    checkProductStock(item.id, item.size, item.color, item.quantity)
      .then(inStock => {
        if (!inStock) {
          console.warn(`Product ${item.name} with size ${item.size} ${item.color ? `and color ${item.color}` : ''} might not have enough stock.`);
        }
      })
      .catch(err => console.error('Error checking stock:', err));
  };

  const removeFromCart = (id: string, size: string, color?: string) => {
    setCart(prev => prev.filter(item => {
      // If color is provided, match on ID, size, AND color
      if (color) {
        return !(item.id === id && item.size === size && item.color === color);
      }
      // Otherwise, match just on ID and size
      return !(item.id === id && item.size === size);
    }));
  };

  const updateQuantity = (id: string, size: string, quantity: number, color?: string) => {
    setCart(prev => 
      prev.map(item => {
        // If color is provided, match on ID, size, AND color
        if (color) {
          return (item.id === id && item.size === size && item.color === color) 
            ? { ...item, quantity } 
            : item;
        }
        // Otherwise, match just on ID and size
        return (item.id === id && item.size === size) 
          ? { ...item, quantity } 
          : item;
      })
    );
    
    // Optionally check if the new quantity is available in stock
    const item = cart.find(item => 
      item.id === id && item.size === size && (!color || item.color === color)
    );
    
    if (item) {
      checkProductStock(id, size, color, quantity)
        .then(inStock => {
          if (!inStock) {
            console.warn(`Requested quantity for ${item.name} might not be available in stock.`);
          }
        })
        .catch(err => console.error('Error checking stock:', err));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Function to handle checkout process and update inventory
  const checkoutCart = async (): Promise<boolean> => {
    if (cart.length === 0) return false;
    
    // Format cart items for inventory update
    const inventoryItems = cart.map(item => ({
      productId: item.id,
      size: item.size,
      color: item.color,
      quantity: item.quantity
    }));
    
    // Update inventory
    const success = await updateInventoryAfterPurchase(inventoryItems);
    
    // If successful, clear the cart
    if (success) {
      clearCart();
    }
    
    return success;
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      cartTotal, 
      itemCount,
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      checkoutCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 
'use client';

import { CartProvider } from '@/app/context/CartContext';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from '@/app/context/ThemeContext';

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 
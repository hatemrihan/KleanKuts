'use client';

import { CartProvider } from '@/app/context/CartContext';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from '@/app/context/ThemeContext';
import { SiteStatusProvider } from '../context/SiteStatusContext';

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
          <SiteStatusProvider>
            {children}
          </SiteStatusProvider>
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 
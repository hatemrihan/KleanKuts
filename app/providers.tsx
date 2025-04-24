'use client';

import { CartProvider } from '@/app/context/CartContext';
import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
  session: any;
};

export function Providers({ children, session }: Props) {
  return (
    <SessionProvider session={session}>
      <CartProvider>
        {children}
      </CartProvider>
    </SessionProvider>
  );
} 
import type { Metadata } from "next";
import { Open_Sans, Abril_Fatface } from 'next/font/google';
import { Providers } from "./providers";
import "./globals.css";
import ThemeInitializer from "./components/ThemeInitializer";

const openSans = Open_Sans({ subsets: ['latin'] });
const abrilFatface = Abril_Fatface({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-abril-fatface'
});

export const metadata: Metadata = {
  title: "ELEVE",
  description: "Elevate your style with ELEVE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${abrilFatface.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={openSans.className}>
        <Providers>
          <ThemeInitializer />
          {children}
        </Providers>
      </body>
    </html>
  );
}

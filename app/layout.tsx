import type { Metadata } from "next";
import { Open_Sans, Abril_Fatface } from 'next/font/google';
import { Providers } from "./providers";
import "./globals.css";
import ThemeInitializer from "./components/ThemeInitializer";
import Script from "next/script";
import dynamic from 'next/dynamic';

// Dynamically import the FacebookPixelManager component with SSR disabled
const FacebookPixelManagerWithNoSSR = dynamic(
  () => import('../components/FacebookPixelManager'),
  { ssr: false }
);

// Dynamically import the SiteStatusCheck component with SSR disabled
const SiteStatusCheckWithNoSSR = dynamic(
  () => import('../components/SiteStatusCheck'),
  { ssr: false }
);

const openSans = Open_Sans({ subsets: ['latin'] });
const abrilFatface = Abril_Fatface({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-abril-fatface'
});

export const metadata: Metadata = {
  title: 'Eleve',
  description: 'Élevé Fashion',
  icons: {
    icon: [
      {
        url: '/favicon.png',
        href: '/favicon.png',
      },
    ],
    apple: {
      url: '/favicon.png',
      href: '/favicon.png',
    }
  },
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
        {/* Google Analytics Tag */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            `,
          }}
        />
      </head>
      <body className={openSans.className}>
        <Providers>
          <ThemeInitializer />
          <SiteStatusCheckWithNoSSR>
            {children}
          </SiteStatusCheckWithNoSSR>
          
          {/* Add the dynamic Facebook Pixel component - it will fetch the pixel ID from the admin */}
          <FacebookPixelManagerWithNoSSR />
        </Providers>
      </body>
    </html>
  );
}

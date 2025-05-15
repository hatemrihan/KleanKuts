import type { Metadata } from "next";
import { Open_Sans, Abril_Fatface } from 'next/font/google';
import { Providers } from "./providers";
import "./globals.css";
import ThemeInitializer from "./components/ThemeInitializer";
import Script from "next/script";

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
        
        {/* Meta Pixel Code */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', 'XXXXXXXXXXXXXXX');
              fbq('track', 'PageView');
            `,
          }}
        />
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

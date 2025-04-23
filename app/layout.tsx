import type { Metadata } from "next";
import { Open_Sans } from 'next/font/google';
import { Providers } from "./providers";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";

const openSans = Open_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "KleanKuts.com",
  description: "Elevate your style with KleanKuts.com",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = null; // We'll initialize session later after fixing auth
  } catch (error) {
    console.error('Session error:', error);
    session = null;
  }

  return (
    <html lang="en" className={openSans.className}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <SessionProvider session={session}>
          <Providers>
            {children}
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}

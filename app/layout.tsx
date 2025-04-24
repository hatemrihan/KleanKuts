import type { Metadata } from "next";
import { Open_Sans } from 'next/font/google';
import { Providers } from "./providers";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

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
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={openSans.className}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

import { Metadata } from 'next';

// Define metadata for the waitlist page
export const metadata: Metadata = {
  title: 'Join Our Waitlist | ELEVE',
  description: 'Sign up to our exclusive waitlist and be the first to know when we launch.',
  openGraph: {
    title: 'Join Our Waitlist | ELEVE',
    description: 'Sign up to our exclusive waitlist and be the first to know when we launch.',
    type: 'website',
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 
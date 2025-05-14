"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AmbassadorSuccessPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  // Redirect after countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/');
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-x-hidden flex flex-col">
      <header className="container max-w-screen-xl mx-auto px-6 md:px-12 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif">ELEVE</Link>
        </div>
      </header>

      <main className="container max-w-screen-xl mx-auto px-6 md:px-12 py-8 flex-grow flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-bounce text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-medium mb-6">Application Submitted Successfully!</h1>
          
          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-8 mb-8">
            <p className="text-lg mb-4">
              Thank you for applying to be an Élevé Ambassador, {session?.user?.name || 'Valued Customer'}!
            </p>
            <p className="mb-4">
              We've received your application and our team will review it shortly. You'll receive an email at {session?.user?.email || 'your email address'} once your application has been reviewed.
            </p>
            <p className="text-black/70 dark:text-white/70">
              The review process typically takes 3-5 business days.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="py-3 px-6 border border-black dark:border-white font-medium text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-sm"
            >
              Return to Home
            </Link>
            <Link
              href="/ambassador"
              className="py-3 px-6 border border-black/20 dark:border-white/20 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              Learn More About the Program
            </Link>
          </div>
          
          <p className="text-sm text-black/50 dark:text-white/50 mt-8">
            Redirecting to home in {countdown} seconds...
          </p>
        </div>
      </main>

      <footer className="container max-w-screen-xl mx-auto px-6 md:px-12 py-8 text-center text-black/60 dark:text-white/60 text-sm">
        © {new Date().getFullYear()} Élevé. All rights reserved.
      </footer>
    </div>
  );
};

export default AmbassadorSuccessPage;

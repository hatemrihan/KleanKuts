'use client'

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SignIn() {
  const searchParams = useSearchParams();
  const [callbackUrl, setCallbackUrl] = useState("/");
  
  useEffect(() => {
    // First check if callbackUrl is directly in the URL params
    const callbackFromParams = searchParams.get("callbackUrl");
    
    // If callback URL is in params, use it
    if (callbackFromParams) {
      setCallbackUrl(callbackFromParams);
      return;
    }
    
    // Otherwise check localStorage for the last visited page
    const lastPath = localStorage.getItem("lastPath");
    if (lastPath) {
      setCallbackUrl(lastPath);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 
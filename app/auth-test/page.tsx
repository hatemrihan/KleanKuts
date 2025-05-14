"use client";

import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthTest() {
  const { data: session, status } = useSession();
  const [envVars, setEnvVars] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch environment variables through an API route
    fetch('/api/auth-debug')
      .then(res => res.json())
      .then(data => {
        setEnvVars(data);
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  const handleSignIn = () => {
    signIn('google', { 
      callbackUrl: '/', 
      redirect: true
    });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-6">NextAuth Debug Page</h1>
      
      <div className="mb-8 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Session Status: {status}</h2>
        {session ? (
          <div>
            <p className="mb-2">✅ Signed in as: {session.user?.email}</p>
            <button 
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2">❌ Not signed in</p>
            <button 
              onClick={handleSignIn}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign in with Google
            </button>
            <p className="mt-2 text-sm text-gray-600">
              This will test the Google OAuth flow directly
            </p>
          </div>
        )}
      </div>

      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        {error && <p className="text-red-500">Error: {error}</p>}
        {envVars ? (
          <div className="whitespace-pre-wrap font-mono text-sm">
            <p>NEXTAUTH_URL: {envVars.NEXTAUTH_URL}</p>
            <p>GOOGLE_CLIENT_ID: {envVars.GOOGLE_CLIENT_ID ? 
              `${envVars.GOOGLE_CLIENT_ID.substring(0, 12)}...` : 'Not set'}</p>
            <p>Client Secret: {envVars.hasClientSecret ? '✅ Set' : '❌ Not set'}</p>
            <p>NEXTAUTH_SECRET: {envVars.hasSecret ? '✅ Set' : '❌ Not set'}</p>
            <p>Base URL: {envVars.baseUrl}</p>
          </div>
        ) : (
          <p>Loading environment information...</p>
        )}
      </div>

      <div className="mb-8 p-4 border rounded bg-yellow-50">
        <h2 className="text-xl font-semibold mb-2">Debugging Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Ensure Google Cloud Console has the correct redirect URI: <code className="bg-gray-200 px-1">{envVars?.baseUrl}/api/auth/callback/google</code></li>
          <li>Make sure JavaScript Origins includes: <code className="bg-gray-200 px-1">{envVars?.baseUrl}</code></li>
          <li>Check that NEXTAUTH_URL in your environment matches your deployment URL</li>
          <li>Verify that Google Cloud OAuth credentials are for a "Web application" type</li>
          <li>Try completely signing out of your Google account and signing in again</li>
        </ul>
      </div>
    </div>
  );
}

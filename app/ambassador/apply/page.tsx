"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Function to notify our admin system
const notifyAdminSystem = async (formData: FormData) => {
  try {
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    
    // Convert FormData to regular object
    const formDataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      formDataObj[key] = value;
    });
    
    // Remove form-name and bot-field from the data sent to admin
    delete formDataObj['form-name'];
    delete formDataObj['bot-field'];
    
    await fetch('https://eleveadmin.netlify.app/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SHARED_API_SECRET}`
      },
      body: JSON.stringify({
        type: 'ambassador_application',
        data: {
          email,
          name: fullName,
          formData: formDataObj
        }
      })
    });
  } catch (error) {
    console.error('Error notifying admin system:', error);
    // Continue anyway - user doesn't need to know about this
  }
};

const AmbassadorApplicationPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  
  // Application form states
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    instagramHandle: '',
    tiktokHandle: '',
    otherSocialMedia: '',
    personalStyle: 'Minimalist and timeless',
    soldBefore: 'No',
    promotionPlan: '',
    investmentOption: 'Maybe, I need more details.',
    contentComfort: 'Somewhat comfortable—I\'m willing to learn.',
    instagramFollowers: '',
    tiktokFollowers: '',
    otherFollowers: '',
    targetAudience: 'Fashion enthusiasts',
    otherAudience: '',
    motivation: '',
    hasCamera: 'Yes',
    attendEvents: 'Depends',
    agreeToTerms: 'Yes, I agree.',
    additionalInfo: '',
    questions: ''
  });

  // If user is not authenticated, redirect to sign in
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Store current path in localStorage to redirect back after authentication
      localStorage.setItem('lastPath', '/ambassador/apply');
      signIn('google', { callbackUrl: '/ambassador/apply' });
    }
  }, [status]);
  
  // Pre-fill form with user data when session is available
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        fullName: session.user?.name || '',
        email: session.user?.email || '',
      }));
    }
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Use functional update to ensure we're working with the latest state
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Do NOT prevent default or stop propagation
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!session) {
      // Store current path before redirecting to sign in
      localStorage.setItem('lastPath', '/ambassador/apply');
      signIn('google', { callbackUrl: '/ambassador/apply' });
      return;
    }

    setIsRequesting(true);
    setRequestStatus('');

    try {
      // Validate required fields before submission
      if (!formData.fullName) {
        setRequestStatus('error-validation');
        alert('Full name is required');
        setIsRequesting(false);
        return;
      }
      
      if (!formData.email) {
        setRequestStatus('error-validation');
        alert('Email is required');
        setIsRequesting(false);
        return;
      }
      
      if (!formData.instagramHandle) {
        setRequestStatus('error-validation');
        alert('Instagram handle is required');
        setIsRequesting(false);
        return;
      }
      
      try {
        // Direct API call to admin system (similar to checkout functionality)
        const response = await fetch('https://eleveadmin.netlify.app/api/ambassadors/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SHARED_API_SECRET}`
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            instagramHandle: formData.instagramHandle,
            tiktokHandle: formData.tiktokHandle,
            otherSocialMedia: formData.otherSocialMedia,
            personalStyle: formData.personalStyle,
            soldBefore: formData.soldBefore,
            promotionPlan: formData.promotionPlan,
            investmentOption: formData.investmentOption,
            contentComfort: formData.contentComfort,
            instagramFollowers: formData.instagramFollowers,
            tiktokFollowers: formData.tiktokFollowers,
            otherFollowers: formData.otherFollowers,
            targetAudience: formData.targetAudience,
            otherAudience: formData.otherAudience,
            motivation: formData.motivation,
            hasCamera: formData.hasCamera,
            attendEvents: formData.attendEvents,
            agreeToTerms: formData.agreeToTerms,
            additionalInfo: formData.additionalInfo,
            questions: formData.questions,
            user: {
              name: session?.user?.name || '',
              email: session?.user?.email || ''
            }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', response.status, errorData);
          throw new Error(`${response.status}`);
        }
        
        // Also notify our admin system as a backup
        const formEl = e.target as HTMLFormElement;
        const formDataObj = new FormData(formEl);
        await notifyAdminSystem(formDataObj);
        
        // Update UI state
        setRequestStatus('success');
        
        // Show success message
        alert('Your ambassador application has been submitted successfully! Our team will review your application and contact you soon.');
        
        // Redirect to a special waiting/pending page that explains the approval process
        router.push(`/ambassador/pending?email=${encodeURIComponent(formData.email)}`);
      } catch (error) {
        console.error('Error in direct API call:', error);
        throw error; // Let the outer catch block handle this
      }
    } catch (error) {
      console.error('Error submitting ambassador request:', error);
      setRequestStatus('error');
      
      // Display a more user-friendly error message
      let errorMessage = 'There was a problem submitting your application.';
      let shouldRetry = false;
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'You need to sign in again to continue.';
          // Clear session and redirect to sign in
          setTimeout(() => signIn('google', { callbackUrl: '/ambassador/apply' }), 1500);
        } else if (error.message.includes('409')) {
          errorMessage = 'You already have a pending ambassador application. Please wait for admin approval at eleveadmin.netlify.app';
          // Redirect to the pending page with the application email as a query parameter
          setTimeout(() => router.push(`/ambassador/pending?email=${encodeURIComponent(formData.email)}`), 2000);
        } else if (error.message.includes('500')) {
          errorMessage = 'The server encountered an error. We\'ve logged this issue and will fix it soon. Please try again in a few minutes.';
          shouldRetry = true;
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
          shouldRetry = true;
        } else if (error.message.includes('Database connection failed')) {
          errorMessage = 'Our database is currently experiencing high traffic. Please try again in a few minutes.';
          shouldRetry = true;
        } else {
          // General error handling
          errorMessage = 'There was a problem with your submission. Please try again later.';
        }
      }
      
      // Show error message
      alert(errorMessage);
      
      // If we should retry, offer a retry button
      if (shouldRetry) {
        const retry = confirm('Would you like to try submitting your application again?');
        if (retry) {
          // Wait a moment before retrying
          setTimeout(() => handleSubmit(e), 1000);
          return;
        }
      }
    } finally {
      setIsRequesting(false);
    }
  };

  // Wait for authentication to complete
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-x-hidden flex items-center justify-center">
        <div className="text-3xl font-serif animate-pulse">ELEVE</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-x-hidden">
      <header className="container max-w-screen-xl mx-auto px-6 md:px-12 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif">ELEVE</Link>
          <Link href="/ambassador" className="text-sm underline">Back to Ambassador Program</Link>
        </div>
      </header>

      <main className="container max-w-screen-xl mx-auto px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-medium mb-6">Ambassador Application</h1>
          <p className="text-black/70 dark:text-white/70 mb-8">Please fill out the following form to apply to become an Élevé Ambassador.</p>
          
          <form 
            onSubmit={handleSubmit} 
            className="flex flex-col gap-6"
          >
            {/* Basic Information */}
            <div className="border-b border-black/10 dark:border-white/10 pb-6">
              <h2 className="text-xl font-medium mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    autoComplete="name"
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    autoComplete="tel"
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Your phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="email"
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Your email address"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Presence */}
            <div className="border-b border-black/10 dark:border-white/10 pb-6">
              <h2 className="text-xl font-medium mb-4">Social Media Presence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="instagramHandle" className="block text-sm font-medium mb-1">Instagram Handle *</label>
                  <input
                    type="text"
                    id="instagramHandle"
                    name="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Your Instagram handle"
                  />
                </div>
                <div>
                  <label htmlFor="tiktokHandle" className="block text-sm font-medium mb-1">TikTok Handle</label>
                  <input
                    type="text"
                    id="tiktokHandle"
                    name="tiktokHandle"
                    value={formData.tiktokHandle}
                    onChange={handleInputChange}
                    autoComplete="off"
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Your TikTok handle"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="otherSocialMedia" className="block text-sm font-medium mb-1">Other Social Media Platforms</label>
                  <input
                    type="text"
                    id="otherSocialMedia"
                    name="otherSocialMedia"
                    value={formData.otherSocialMedia}
                    onChange={handleInputChange}
                    autoComplete="off"
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="e.g. Facebook, YouTube, etc."
                  />
                </div>
              </div>
            </div>

            {/* Selling Ability & Vision */}
            <div className="border-b border-black/10 dark:border-white/10 pb-6">
              <h2 className="text-xl font-medium mb-4">Selling Ability & Vision</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="personalStyle" className="block text-sm font-medium mb-1">How would you describe your personal style?</label>
                  <select
                    id="personalStyle"
                    name="personalStyle"
                    value={formData.personalStyle}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="Minimalist and timeless">Minimalist and timeless</option>
                    <option value="Trendy and experimental">Trendy and experimental</option>
                    <option value="Bold and statement-driven">Bold and statement-driven</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="soldBefore" className="block text-sm font-medium mb-1">Have you ever sold products online or in person before?</label>
                  <select
                    id="soldBefore"
                    name="soldBefore"
                    value={formData.soldBefore}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="promotionPlan" className="block text-sm font-medium mb-1">How do you plan to promote Élevé?</label>
                  <textarea
                    id="promotionPlan"
                    name="promotionPlan"
                    value={formData.promotionPlan}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Describe your promotion strategies"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="motivation" className="block text-sm font-medium mb-1">Why do you want to be an Élevé Ambassador?</label>
                  <textarea
                    id="motivation"
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Share your motivation"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-b border-black/10 dark:border-white/10 pb-6">
              <h2 className="text-xl font-medium mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hasCamera" className="block text-sm font-medium mb-1">Do you have access to a good quality camera or smartphone for creating content?</label>
                  <select
                    id="hasCamera"
                    name="hasCamera"
                    value={formData.hasCamera}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="attendEvents" className="block text-sm font-medium mb-1">Would you be willing to attend Élevé events or pop-ups?</label>
                  <select
                    id="attendEvents"
                    name="attendEvents"
                    value={formData.attendEvents}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Depends">Depends</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Terms and Additional Comments */}
            <div className="border-b border-black/10 dark:border-white/10 pb-6">
              <h2 className="text-xl font-medium mb-4">Terms & Additional Comments</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="agreeToTerms" className="block text-sm font-medium mb-1">Do you agree to the ambassador terms and conditions?</label>
                  <div className="flex items-center">
                    <select
                      id="agreeToTerms"
                      name="agreeToTerms"
                      value={formData.agreeToTerms}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    >
                      <option value="Yes, I agree.">Yes, I agree.</option>
                      <option value="No, I need more information.">No, I need more information.</option>
                    </select>
                    <Link 
                      href="/ambassador/terms"
                      className="ml-2 text-sm underline"
                      target="_blank"
                    >
                      View Terms
                    </Link>
                  </div>
                </div>
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium mb-1">Anything else you'd like us to know about you?</label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Share any additional information"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="questions" className="block text-sm font-medium mb-1">Anything else you'd like to know about us?</label>
                  <textarea
                    id="questions"
                    name="questions"
                    value={formData.questions}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full p-3 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Ask any questions you have"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={isRequesting}
                className="w-full py-4 px-6 border border-black dark:border-white font-medium text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? 'Submitting...' : 'Submit Application'}
              </button>
              <p className="text-center text-black/60 dark:text-white/60 text-sm mt-4">
                By submitting this application, you agree to our Terms and Conditions.
              </p>
            </div>
          </form>
        </div>
      </main>

      <footer className="container max-w-screen-xl mx-auto px-6 md:px-12 py-8 text-center text-black/60 dark:text-white/60 text-sm">
        © {new Date().getFullYear()} Élevé. All rights reserved.
      </footer>
    </div>
  );
};

export default AmbassadorApplicationPage;

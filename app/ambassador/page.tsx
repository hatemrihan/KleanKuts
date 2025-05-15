"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import Nav from "@/app/sections/nav"
import Loader from "@/components/loader";

const AmbassadorPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  const [ambassadorStatus, setAmbassadorStatus] = useState('none'); // 'none', 'pending', 'approved'
  
  // Application form states
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
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

  useEffect(() => {
    // Simulate content loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // If user is logged in, check if they're already an ambassador or have a pending request
    if (session?.user?.email) {
      fetch(`/api/ambassador/status?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => {
          setAmbassadorStatus(data.status || 'none');
        })
        .catch(err => {
          console.error('Error checking ambassador status:', err);
        });
    }

    return () => clearTimeout(timer);
  }, [session])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Use functional update to ensure we're working with the latest state
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Do NOT prevent default or stop propagation - this was causing the focus issue
    // Just let the normal input event flow continue
  };

  const handleShowApplicationForm = () => {
    if (!session) {
      // Store current path before redirecting to sign in
      localStorage.setItem('lastPath', '/ambassador');
      signIn('google', { callbackUrl: '/ambassador' });
      return;
    }
    
    // Pre-fill email if available
    if (session.user?.email) {
      setFormData(prev => ({
        ...prev,
        email: session.user?.email || '',
        fullName: session.user?.name || ''
      }));
    }
    
    setShowApplicationForm(true);
  };

  const handleAmbassadorRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!session) {
      // Store current path before redirecting to sign in
      localStorage.setItem('lastPath', '/ambassador');
      signIn('google', { callbackUrl: '/ambassador' });
      return;
    }

    // If application form is not shown yet, show it
    if (!showApplicationForm) {
      handleShowApplicationForm();
      return;
    }

    setIsRequesting(true);
    setRequestStatus('');

    try {
      // Validate required fields before submission
      if (!formData.fullName && !session?.user?.name) {
        setRequestStatus('error-validation');
        alert('Full name is required');
        setIsRequesting(false);
        return;
      }
      
      if (!formData.email && !session?.user?.email) {
        setRequestStatus('error-validation');
        alert('Email is required');
        setIsRequesting(false);
        return;
      }
      
      // Check if terms checkbox is checked
      const termsCheckbox = document.getElementById('terms_checkbox') as HTMLInputElement;
      if (!termsCheckbox?.checked) {
        setRequestStatus('error-validation');
        alert('You must accept the terms and conditions');
        setIsRequesting(false);
        return;
      }
      
      // Add a unique timestamp to avoid duplicate collisions
      const uniqueTimestamp = Date.now().toString();
      
      // Attempt to submit the form with retries
      let retryCount = 0;
      let submitted = false;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !submitted) {
        try {
          // Simplify the data sent to the API to troubleshoot the 500 error
          const response = await fetch('/api/ambassador/request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Request-Time': uniqueTimestamp, // Add timestamp to help ensure uniqueness
            },
            body: JSON.stringify({
              // Only send the most basic required information
              name: `${formData.fullName || session?.user?.name || ''}_${retryCount > 0 ? retryCount : ''}`,
              email: formData.email || session?.user?.email || '',
              
              // Send a simplified version of the form data to avoid potential serialization issues
              formData: {
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                instagramHandle: formData.instagramHandle,
                tiktokHandle: formData.tiktokHandle,
                // Include only string values, not complex objects
                otherSocialMedia: formData.otherSocialMedia.toString()
              }
            }),
          });

          // Check if response is OK
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response Status:', response.status);
            console.error('API Response Text:', errorText);
            
            // Check if this is a duplicate key error
            if (response.status === 500 && errorText.includes('E11000') && retryCount < maxRetries - 1) {
              console.log(`Retrying submission (attempt ${retryCount + 1})...`);
              retryCount++;
              continue;
            }
            
            // For other errors, or if we've exhausted retries, throw
            throw new Error(`API error: ${response.status} - ${errorText || 'No error details available'}`);
          }
          
          // If we get here, submission was successful
          const data = await response.json();
          submitted = true;
          
          setRequestStatus('success');
          setAmbassadorStatus('pending');
          setShowApplicationForm(false); // Hide form after successful submission
          // Show success message
          alert('Your ambassador application has been submitted successfully!');
        } catch (retryError) {
          if (retryCount < maxRetries - 1) {
            console.log(`Retry failed, trying again (${retryCount + 1})...`);
            retryCount++;
          } else {
            throw retryError; // Re-throw if all retries failed
          }
        }
      }
    } catch (error) {
      console.error('Error submitting ambassador request:', error);
      setRequestStatus('error');
      
      // Display a more user-friendly error message
      let errorMessage = 'There was a problem submitting your application.';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'You need to sign in again to continue.';
          // Clear session and redirect to sign in
          setTimeout(() => signIn('google', { callbackUrl: '/ambassador' }), 1500);
        } else if (error.message.includes('409')) {
          errorMessage = 'You already have a pending ambassador application.';
        } else if (error.message.includes('500')) {
          errorMessage = 'The server encountered an error. Please try again later.';
          // Check if it's a duplicate key error
          if (error.message.includes('duplicate key') || error.message.includes('E11000')) {
            errorMessage = 'A technical issue occurred. Please try again - the system will generate a new unique code for you.';
          }
        }
      }
      
      // Show error message
      alert(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  };

  // Store current URL before authentication for returning the user to the same page
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Store current path in localStorage to redirect back after authentication
      localStorage.setItem('lastPath', window.location.pathname);
    }
  }, [status]);

  // Handle redirect after authentication
  useEffect(() => {
    if (status === 'authenticated' && !isLoaded) {
      // Check if we need to redirect back to a previous page
      const lastPath = localStorage.getItem('lastPath');
      if (lastPath && lastPath !== window.location.pathname) {
        // Clear the stored path and redirect
        localStorage.removeItem('lastPath');
        // Only redirect if not already on the correct path
        if (window.location.pathname !== lastPath) {
          router.push(lastPath);
        }
      }
    }
  }, [status, isLoaded, router]);

  // Show welcome message for approved ambassadors
  if (ambassadorStatus === 'approved' && status === 'authenticated') {
    // Display welcome message for 5 seconds before redirecting
    useEffect(() => {
      const redirectTimer = setTimeout(() => {
        router.push('/ambassador/dashboard');
      }, 5000);
      
      return () => clearTimeout(redirectTimer);
    }, []);
    
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-x-hidden">
        <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col items-center justify-center transition-opacity duration-700 opacity-100">
          <div className="text-4xl font-serif mb-4">ÉLEVE</div>
          <div className="text-xl mb-6">Welcome, {session?.user?.name || 'Ambassador'}!</div>
          <div className="text-base mb-8 animate-pulse">Redirecting to your dashboard...</div>
          
          <div className="flex space-x-6">
            <a 
              href="/" 
              className="py-2 px-6 border border-black dark:border-white text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all font-medium"
            >
              HOME
            </a>
            <a 
              href="/ambassador/dashboard" 
              className="py-2 px-6 border border-black dark:border-white text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all font-medium"
            >
              DASHBOARD
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Initial loading state
  if (status === 'loading') {
    return <Loader />;
  }

  // Application Form Component
  const ApplicationForm = () => (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-semibold">Ambassador Application Form</h2>
          <button 
            onClick={() => setShowApplicationForm(false)}
            className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleAmbassadorRequest} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onFocus={(e) => e.target.select()}
                  required
                  autoComplete="name"
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  onFocus={(e) => e.target.select()}
                  autoComplete="tel"
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
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
                  onFocus={(e) => e.target.select()}
                  required
                  autoComplete="email"
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
          </div>

          {/* Social Media Presence */}
          <div>
            <h3 className="text-lg font-medium mb-4">Social Media Presence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="instagramHandle" className="block text-sm font-medium mb-1">Instagram Handle *</label>
                <input
                  type="text"
                  id="instagramHandle"
                  name="instagramHandle"
                  value={formData.instagramHandle}
                  onChange={handleInputChange}
                  onFocus={(e) => e.target.select()}
                  required
                  autoComplete="off"
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
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
                  onFocus={(e) => e.target.select()}
                  autoComplete="off"
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
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
                  onFocus={(e) => e.target.select()}
                  autoComplete="off"
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  placeholder="e.g. Facebook, YouTube, etc."
                />
              </div>
            </div>
          </div>

          {/* Selling Ability & Vision */}
          <div>
            <h3 className="text-lg font-medium mb-4">Selling Ability & Vision</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="personalStyle" className="block text-sm font-medium mb-1">How would you describe your personal style?</label>
                <select
                  id="personalStyle"
                  name="personalStyle"
                  value={formData.personalStyle}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
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
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
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
                  onFocus={(e) => e.target.select()}
                  rows={3}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                ></textarea>
              </div>
              <div>
                <label htmlFor="investmentOption" className="block text-sm font-medium mb-1">Would you consider investing between 1,500-3,000 EGP in Élevé merchandise to start your journey?</label>
                <select
                  id="investmentOption"
                  name="investmentOption"
                  value={formData.investmentOption}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                >
                  <option value="Yes, I'm ready!">Yes, I'm ready!</option>
                  <option value="Maybe, I need more details.">Maybe, I need more details.</option>
                  <option value="No, I'm not sure about investing yet.">No, I'm not sure about investing yet.</option>
                </select>
              </div>
              <div>
                <label htmlFor="contentComfort" className="block text-sm font-medium mb-1">How comfortable are you with creating content for social media?</label>
                <select
                  id="contentComfort"
                  name="contentComfort"
                  value={formData.contentComfort}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                >
                  <option value="Very comfortable—I do it regularly.">Very comfortable—I do it regularly.</option>
                  <option value="Somewhat comfortable—I'm willing to learn.">Somewhat comfortable—I'm willing to learn.</option>
                  <option value="Not comfortable—I would need assistance.">Not comfortable—I would need assistance.</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audience & Reach */}
          <div>
            <h3 className="text-lg font-medium mb-4">Audience & Reach</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="instagramFollowers" className="block text-sm font-medium mb-1">Instagram Followers</label>
                <input
                  type="text"
                  id="instagramFollowers"
                  name="instagramFollowers"
                  value={formData.instagramFollowers}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  placeholder="Number of followers"
                />
              </div>
              <div>
                <label htmlFor="tiktokFollowers" className="block text-sm font-medium mb-1">TikTok Followers</label>
                <input
                  type="text"
                  id="tiktokFollowers"
                  name="tiktokFollowers"
                  value={formData.tiktokFollowers}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  placeholder="Number of followers"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">Who do you think is your target audience?</label>
                <select
                  id="targetAudience"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                >
                  <option value="Fashion enthusiasts">Fashion enthusiasts</option>
                  <option value="Young professionals">Young professionals</option>
                  <option value="Students and trendsetters">Students and trendsetters</option>
                  <option value="Other">Other</option>
                </select>
                {formData.targetAudience === "Other" && (
                  <input
                    type="text"
                    id="otherAudience"
                    name="otherAudience"
                    value={formData.otherAudience}
                    onChange={handleInputChange}
                    className="w-full mt-2 p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Please specify"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Motivation & Goals */}
          <div>
            <h3 className="text-lg font-medium mb-4">Motivation & Goals</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="motivation" className="block text-sm font-medium mb-1">Why do you want to become an Élevé ambassador?</label>
                <textarea
                  id="motivation"
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  onFocus={(e) => e.target.select()}
                  rows={3}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hasCamera" className="block text-sm font-medium mb-1">Do you have access to a good quality camera or smartphone for creating content?</label>
                  <select
                    id="hasCamera"
                    name="hasCamera"
                    value={formData.hasCamera}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
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
                    className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Depends">Depends</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div>
            <h3 className="text-lg font-medium mb-4">Confirmation</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="agreeToTerms" className="block text-sm font-medium mb-1">Do you agree to the ambassador terms and conditions?</label>
                <div className="flex items-center">
                  <select
                    id="agreeToTerms"
                    name="agreeToTerms"
                    value={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="Yes, I agree.">Yes, I agree.</option>
                    <option value="No, I need more information.">No, I need more information.</option>
                  </select>
                  <button 
                    type="button" 
                    className="ml-2 text-sm underline" 
                    onClick={() => setShowTerms(true)}
                  >
                    View Terms
                  </button>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="terms_checkbox"
                  className="h-4 w-4 rounded-sm border border-black/20 dark:border-white/20"
                  required
                />
                <label
                  htmlFor="terms_checkbox"
                  className="text-sm leading-none"
                >
                  I have read and accept the{" "}
                  <button 
                    type="button" 
                    className="underline font-medium text-black dark:text-white hover:text-black/70 dark:hover:text-white/70"
                    onClick={() => setShowTerms(true)}
                  >
                    terms and conditions
                  </button>
                </label>
              </div>

              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium mb-1">Anything else you'd like us to know about you?</label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  onFocus={(e) => e.target.select()}
                  rows={2}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                ></textarea>
              </div>
              <div>
                <label htmlFor="questions" className="block text-sm font-medium mb-1">Anything else you'd like to know about us?</label>
                <textarea
                  id="questions"
                  name="questions"
                  value={formData.questions}
                  onChange={handleInputChange}
                  onFocus={(e) => e.target.select()}
                  rows={2}
                  className="w-full p-2 border border-black/20 dark:border-white/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-black/10 dark:border-white/10">
            {/* Terms and Conditions Checkbox */}
            <div className="flex-1 items-center space-x-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms_checkbox"
                  className="h-4 w-4 rounded-sm border border-black/20 dark:border-white/20"
                  required
                />
                <label
                  htmlFor="terms_checkbox"
                  className="text-sm leading-none ml-2"
                >
                  I have read and accept the{" "}
                  <button 
                    type="button" 
                    className="underline font-medium text-black dark:text-white hover:text-black/70 dark:hover:text-white/70"
                    onClick={() => setShowTerms(true)}
                  >
                    terms and conditions
                  </button>
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowApplicationForm(false)}
              className="py-3 px-6 border border-black/20 dark:border-white/20 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRequesting}
              className="py-3 px-6 border border-black dark:border-white font-medium text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequesting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  // Terms and Conditions Component
  const TermsAndConditions = () => (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-semibold">Élevé Ambassador Terms and Conditions</h2>
          <button 
            onClick={() => setShowTerms(false)}
            className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h4 className="font-medium italic mb-2">Eligibility</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Ambassadors must have an active TikTok account with consistent engagement and quality content.</li>
            <li className="mb-1">Ambassadors are required to invest in a premium subscription to participate in the program and gain access to the current and upcoming Élevé collections for free.</li>
            <li className="mb-1">Investment Options:
              <ul className="list-disc pl-5 mt-1">
                <li><span className="italic">EGP 1,500</span>:
                  <ul className="list-disc pl-5">
                    <li>Commission: 10% per sale.</li>
                    <li>Minimum Sales Requirement: 5 items per month.</li>
                  </ul>
                </li>
                <li><span className="italic">EGP 3,000</span>:
                  <ul className="list-disc pl-5">
                    <li>Commission: 25% per sale.</li>
                    <li>Minimum Sales Requirement: 10 items per month.</li>
                  </ul>
                </li>
              </ul>
            </li>
          </ol>

          <h4 className="font-medium italic mb-2">Performance and Termination</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Ambassadors who do not meet the monthly sales requirement will receive up to <span className="italic">two warnings</span>:
              <ul className="list-disc pl-5 mt-1">
                <li>If an ambassador selling under the <span className="italic">EGP 1,500</span> tier fails to sell 5 items in three consecutive months, they will be terminated from the system.</li>
                <li>If an ambassador selling under the <span className="italic">EGP 3,000</span> tier fails to sell 10 items in three consecutive months, they will also be terminated.</li>
              </ul>
            </li>
          </ol>

          <h4 className="font-medium italic mb-2">Content and Promotion</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Ambassadors must tag Élevé's official Instagram and TikTok accounts (@eleve__egy) in all related posts.</li>
            <li className="mb-1">Ambassadors must use the hashtag <span className="italic">#eleve__egy</span> in promotional content.</li>
            <li className="mb-1">Content should align with the Élevé brand identity, focusing on luxury, style, and sophistication.</li>
          </ol>

          <h4 className="font-medium italic mb-2">Representation</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Ambassadors are permitted to represent other brands; however, they must ensure there is no conflict of interest with Élevé's branding and values.</li>
          </ol>

          <h4 className="font-medium italic mb-2">Payment and Incentives</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Payments will be made on a <span className="italic">monthly basis</span>:
              <ul className="list-disc pl-5 mt-1">
                <li>Through <span className="italic">Instapay</span> or in-person <span className="italic">cash transactions</span>.</li>
              </ul>
            </li>
            <li className="mb-1">Payments are calculated based on the commission percentage of the total sales achieved.</li>
          </ol>

          <h4 className="font-medium italic mb-2">Confidentiality</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Ambassadors agree to keep all Élevé-related information confidential, including but not limited to:
              <ul className="list-disc pl-5 mt-1">
                <li>Marketing strategies.</li>
                <li>Unreleased product details.</li>
                <li>Sales data and reports.</li>
              </ul>
            </li>
            <li className="mb-1">Breach of confidentiality will result in immediate termination and possible legal action.</li>
          </ol>

          <h4 className="font-medium italic mb-2">General Conduct</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Ambassadors must always act professionally and respectfully while representing Élevé.</li>
            <li className="mb-1">Any form of misconduct, inappropriate behavior, or content that damages the brand's reputation will lead to immediate termination.</li>
          </ol>

          <h4 className="font-medium italic mb-2">Program Modifications</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Élevé reserves the right to modify the program, including commission rates, sales targets, and other terms, with prior notice.</li>
            <li className="mb-1">Policy updates will be communicated via email or through the ambassador dashboard.</li>
          </ol>

          <h4 className="font-medium italic mb-2">Termination</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-1">Élevé reserves the right to terminate any ambassador's membership at its discretion if the terms and conditions are violated.</li>
          </ol>
        </div>
        
        <div className="mt-8 flex">
          <Link
            href="/ambassador/apply"
            className="py-3 px-6 border border-black dark:border-white font-medium text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-sm"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-x-hidden">
      {/* Initial loader */}
      <div 
        className={`fixed inset-0 z-[100] bg-white dark:bg-black flex items-center justify-center transition-opacity duration-700 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="text-3xl font-serif animate-pulse">ELEVE</div>
      </div>
      
      {/* Terms and Conditions Modal */}
      {showTerms && <TermsAndConditions />}
      
      {/* Application Form Modal */}
      {showApplicationForm && <ApplicationForm />}

      <Nav />
      
      {/* User signed in confirmation - Mobile View */}
      {session && status === 'authenticated' && (
        <div className="fixed top-14 left-0 right-0 bg-black/5 dark:bg-white/5 py-2 px-6 text-sm text-center md:hidden z-10">
          Welcome, <span className="font-medium">{session.user?.name || 'User'}</span>
        </div>
      )}
      
      <main className="py-32">
        <div className="container max-w-6xl mx-auto px-6 md:px-12">
          <nav className="flex items-center justify-between mb-20">
            <Link href="/" className="text-black dark:text-white opacity-60 hover:opacity-100 transition-opacity text-sm">
              Home
            </Link>
            
            <div className="flex items-center space-x-4">
              <span className="opacity-20">Ambassador</span>
            </div>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Left column */}
            <div>
              <h1 className="text-4xl md:text-6xl font-serif font-extrabold tracking-tight mb-6">
                Ambassador Program
              </h1>
              
              <div className="relative h-[50vh] mb-6">
                <img 
                  src="/images/ambb-image.jpg" 
                  alt="Eleve Ambassador Program"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-black/60 dark:text-white/60 mb-1">Negotiation</h3>
                  <p className="text-sm">Starting from 10% Commission</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-black/60 dark:text-white/60 mb-1">Status</h3>
                  <p className="text-sm">{ambassadorStatus === 'pending' ? 'Application Pending' : 'Open for Applications'}</p>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div>

              <div className="mb-8">
                <h2 className="text-sm uppercase tracking-wider text-black/60 dark:text-white/60 mb-3">About</h2>
                <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed mb-4">
                  Become an Eleve ambassador and earn commissions on sales made through your 
                  unique referral link. Share your love for our products with your audience 
                  and get rewarded for every purchase they make!
                </p>
                <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed">
                  Our ambassador program is designed to build a community of fashion enthusiasts 
                  who believe in our brand values and want to spread the word about our products.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-sm uppercase tracking-wider text-black/60 dark:text-white/60 mb-3">How It Works</h2>
                
                <div className="mb-4">
                  <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed font-medium">1. Apply to become an ambassador</p>
                  <p className="text-black/70 dark:text-white/70 text-xs leading-relaxed">
                    Fill out a simple application to join our program
                  </p>
                </div>
                
                <div className="mb-4">
                  <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed font-medium">2. Get approved</p>
                  <p className="text-black/70 dark:text-white/70 text-xs leading-relaxed">
                    Our team will review your application and approve you
                  </p>
                </div>
                
                <div className="mb-4">
                  <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed font-medium">3. Share your unique referral link</p>
                  <p className="text-black/70 dark:text-white/70 text-xs leading-relaxed">
                    Share your custom referral link and promo code with your audience
                  </p>
                </div>
                
                <div className="mb-4">
                  <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed font-medium">4. Earn commissions</p>
                  <p className="text-black/70 dark:text-white/70 text-xs leading-relaxed">
                    Earn a 25% commission on every purchase made with your referral link or code
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-sm uppercase tracking-wider text-black/60 dark:text-white/60 mb-3">Benefits</h2>
                <div className="space-y-2">
                  <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed">
                    • Earn up to 25% commission on all sales through your referral link or code

                  </p>
                  <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed">
                    • Get exclusive early access to new product launches
                  </p>
                  <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed">
                    • Access to special ambassador-only promotions and discounts
                  </p>
                  <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed">
                    • Receive monthly newsletters with tips to maximize your earnings
                  </p>
                </div>
              </div>

              <div className="relative h-[30vh] mb-6">
                <img 
                  src="/images/brand-image.jpg"
                  alt="Eleve Ambassador"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="mt-4 mb-8">
                {!session ? (
                  <button
                    onClick={() => signIn('google')}
                    className="w-full py-3 px-4 inline-flex justify-center items-center gap-2 border border-black dark:border-white font-medium text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-sm"
                  >
                    Sign in to Apply
                  </button>
                ) : ambassadorStatus === 'pending' ? (
                  <div className="border border-black/20 dark:border-white/20 p-4">
                    <h3 className="text-sm font-medium">Application Pending</h3>
                    <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                      Your application is currently under review. We'll notify you once it's approved!
                    </p>
                  </div>
                ) : (
                  <Link
                    href="/ambassador/apply"
                    className="w-full py-3 px-4 inline-flex justify-center items-center gap-2 border border-black dark:border-white font-medium text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-sm"
                  >
                    Apply Now
                  </Link>
                )}

                {requestStatus === 'success' && (
                  <div className="mt-4 border border-green-500/30 dark:border-green-500/30 p-4">
                    <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Application Submitted</h3>
                    <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                      Your application has been submitted successfully! We'll review it and get back to you soon.
                    </p>
                  </div>
                )}

                {requestStatus === 'error' && (
                  <div className="mt-4 border border-red-500/30 dark:border-red-500/30 p-4">
                    <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Error</h3>
                    <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                      There was an error submitting your application. Please try again later.
                    </p>
                  </div>
                )}
              </div>
                
              <div className="flex items-center justify-end mt-10 pt-8 border-t border-black/10 dark:border-white/10">
                <span className="text-xs text-black/60 dark:text-white/60">Designed with love</span>
                <span className="ml-3 w-10 h-[1px] bg-black/20 dark:bg-white/20"></span>
                <span className="ml-3 text-xs">2025</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AmbassadorPage

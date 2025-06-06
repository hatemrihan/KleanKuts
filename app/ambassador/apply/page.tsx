"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/app/sections/nav';
import NewFooter from '@/app/sections/NewFooter';

// Define the form data structure
interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  instagramHandle: string;
  tiktokHandle: string;
  otherSocialMedia: string;
  personalStyle: string;
  soldBefore: string;
  promotionPlan: string;
  investmentOption: string;
  contentComfort: string;
  instagramFollowers: string;
  tiktokFollowers: string;
  otherFollowers: string;
  targetAudience: string;
  otherAudience: string;
  motivation: string;
  hasCamera: string;
  attendEvents: string;
  agreeToTerms: string;
  additionalInfo: string;
  questions: string;
}

const AmbassadorApplicationPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state management
  const [formData, setFormData] = useState<FormData>({
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
  
  // Additional state variables
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Terms and conditions modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);
  
  // Reference for terms modal content
  const termsContentRef = useRef<HTMLDivElement>(null);

  // If user is not authenticated, redirect to sign in
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Current path is already saved by StoreCurrentPath component
      signIn('google');
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

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if there is any
    if (errors[name as keyof FormData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormData];
        return newErrors;
      });
    }
    
    // Clear general error when user updates form
    if (error) {
      setError(null);
    }
  };

  // Handle scroll in terms modal
  const handleTermsScroll = () => {
    if (termsContentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsContentRef.current;
      // Check if user has scrolled to bottom (or close to bottom with a 20px buffer)
      if (scrollHeight - scrollTop - clientHeight < 20) {
        setTermsScrolledToBottom(true);
      }
    }
  };
  
  // Handle closing terms modal
  const handleCloseTermsModal = () => {
    if (termsScrolledToBottom) {
      setHasReadTerms(true);
      setShowTermsModal(false);
    } else {
      alert('Please read the entire terms and conditions before accepting.');
    }
  };
  
  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // If user hasn't read terms yet, prevent checkbox from being checked and show modal
    if (!hasReadTerms) {
      e.preventDefault();
      setShowTermsModal(true);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    // Validate required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.instagramHandle.trim()) newErrors.instagramHandle = 'Instagram handle is required';
    if (!formData.promotionPlan.trim()) newErrors.promotionPlan = 'Promotion plan is required';
    if (!formData.motivation.trim()) newErrors.motivation = 'Motivation is required';
    
    // Check if terms checkbox is checked and terms have been read
    const termsCheckbox = document.getElementById('terms_checkbox') as HTMLInputElement;
    if (!termsCheckbox?.checked) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    } else if (!hasReadTerms) {
      newErrors.agreeToTerms = 'You must read the terms and conditions before agreeing';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Utility function to check ambassador status and redirect if needed
  const checkAmbassadorStatusAndRedirect = async (email: string) => {
    try {
      const response = await fetch(`/api/ambassador/status?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok && data.application) {
        if (data.application.status === 'approved') {
          // Already approved, redirect to dashboard
          setError("You're already an approved ambassador. Redirecting to your dashboard...");
          setTimeout(() => {
            router.push('/ambassador/dashboard');
          }, 1500);
          return true;
        } else if (data.application.status === 'pending') {
          // Pending approval, redirect to pending
          setError('You already have a pending ambassador application. Redirecting to status page...');
          setTimeout(() => {
            router.push(`/ambassador/pending?email=${encodeURIComponent(email)}`);
          }, 1500);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking ambassador status:', error);
      return false;
    }
  };

  // Modify email field change handler to check status when focus is lost
  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    if (email && email.includes('@')) {
      await checkAmbassadorStatusAndRedirect(email);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }
      
      // Check if user is authenticated
      if (!session) {
        // Current path is already saved by StoreCurrentPath component
        signIn('google');
        setIsSubmitting(false);
        return;
      }
      
      // Check if email is already registered as ambassador
      const isRegistered = await checkAmbassadorStatusAndRedirect(formData.email);
      if (isRegistered) {
        setIsSubmitting(false);
        return;
      }
      
      // Log form data before submission
      console.log('Form data being submitted:', formData);
      
      // Generate a unique referral code based on user info and timestamp
      const timestamp = Date.now();
      const uniqueReferralCode = `${formData.fullName.trim().split(' ')[0].toLowerCase()}_${timestamp.toString().slice(-6)}`;
      
      // Submit to admin API using exact endpoint
      console.log('Submitting application to admin API...');
      const response = await fetch('https://eleveadmin.netlify.app/api/ambassadors/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer elv_sk_aP8d2Kw7BxJn5mGq9LrF3yTzVcH6tE4s`,
          'Origin': 'https://elevee.netlify.app'
        },
        mode: 'cors',
        body: JSON.stringify({
          ...formData,
          userName: session?.user?.name || '',
          userEmail: session?.user?.email || '',
          referralCode: uniqueReferralCode
        })
      });
      
      // Log responses for debugging
      console.log('API Response Status:', response.status);
      
      // Clone the response before parsing it (to avoid consuming the response body)
      const responseClone = response.clone();
      const data = await response.json();
      console.log('API Response Data:', data);
      
      if (response.ok) {
        // Show success message
        setSuccess(true);
        
        // Wait a moment before redirecting
        setTimeout(() => {
          router.push(`/ambassador/pending?email=${encodeURIComponent(formData.email)}`);
        }, 3000);
      } else {
        // Handle specific error cases
        if (response.status === 409) {
          // Check if the user is already an approved ambassador using our utility function
          await checkAmbassadorStatusAndRedirect(formData.email);
          
          // Default conflict message if status check fails
          throw new Error('You already have a pending ambassador application. Please wait for admin approval.');
        } else if (response.status === 401) {
          throw new Error('Authentication error. Please sign in again to continue.');
        } else {
          throw new Error(data.error || 'Failed to submit application');
        }
      }
    } catch (error: any) {
      console.error('Application submission error:', error);
      setError(error.message || 'An unexpected error occurred');
      
      // Handle specific errors
      if (error.message.includes('Authentication error')) {
        // Clear session and redirect to sign in after a moment
        setTimeout(() => signIn('google', { callbackUrl: '/ambassador/apply' }), 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-white dark:bg-black pt-20 pb-16 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-10 text-black dark:text-white transition-colors duration-300">
          <h1 className="text-4xl md:text-5xl font-light mb-8">BECOME AN AMBASSADOR</h1>
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
              <h3 className="font-medium mb-2">Application Submission Failed</h3>
              <p>{error}</p>
        </div>
          )}
          
          {success && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded">
              <h3 className="font-medium mb-2">Application Submitted Successfully</h3>
              <p>Thank you for your application! We'll review it shortly and get back to you.</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-medium mb-4">Personal Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name*</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md transition-colors duration-300 bg-white dark:bg-black`}
                    required
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleEmailBlur}
                    className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md transition-colors duration-300 bg-white dark:bg-black`}
                    required
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">Phone Number*</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md transition-colors duration-300 bg-white dark:bg-black`}
                    required
                  />
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
                </div>
              </div>
              
              {/* Social Media Information */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-medium mb-4">Social Media</h2>
            </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="instagramHandle" className="block text-sm font-medium mb-1">Instagram Handle*</label>
                  <input
                    type="text"
                    id="instagramHandle"
                    name="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border ${errors.instagramHandle ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md transition-colors duration-300 bg-white dark:bg-black`}
                    required
                  />
                  {errors.instagramHandle && <p className="mt-1 text-sm text-red-500">{errors.instagramHandle}</p>}
                </div>
                
                <div>
                  <label htmlFor="instagramFollowers" className="block text-sm font-medium mb-1">Instagram Followers</label>
                  <input
                    type="text"
                    id="instagramFollowers"
                    name="instagramFollowers"
                    value={formData.instagramFollowers}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="tiktokHandle" className="block text-sm font-medium mb-1">TikTok Handle (if applicable)</label>
                  <input
                    type="text"
                    id="tiktokHandle"
                    name="tiktokHandle"
                    value={formData.tiktokHandle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  />
                </div>
              </div>
              
                <div className="md:col-span-2">
                <div>
                  <label htmlFor="otherSocialMedia" className="block text-sm font-medium mb-1">Other Social Media Accounts</label>
                  <input
                    type="text"
                    id="otherSocialMedia"
                    name="otherSocialMedia"
                    value={formData.otherSocialMedia}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                    placeholder="List other social media accounts and handles"
                  />
                </div>
              </div>
              
              {/* Audience & Style */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-medium mb-4">Audience & Style</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">Target Audience</label>
                  <select
                    id="targetAudience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  >
                    <option value="Fashion enthusiasts">Fashion enthusiasts</option>
                    <option value="Luxury buyers">Luxury buyers</option>
                    <option value="Trend followers">Trend followers</option>
                    <option value="Sustainability-focused">Sustainability-focused</option>
                    <option value="Other">Other (please specify)</option>
                  </select>
                </div>
                
                {formData.targetAudience === 'Other' && (
                  <div>
                    <label htmlFor="otherAudience" className="block text-sm font-medium mb-1">Specify Your Audience</label>
                    <input
                      type="text"
                      id="otherAudience"
                      name="otherAudience"
                      value={formData.otherAudience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                    />
                  </div>
                )}
            </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="personalStyle" className="block text-sm font-medium mb-1">Your Personal Style</label>
                  <select
                    id="personalStyle"
                    name="personalStyle"
                    value={formData.personalStyle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  >
                    <option value="Minimalist and timeless">Minimalist and timeless</option>
                    <option value="Bold and trendy">Bold and trendy</option>
                    <option value="Vintage-inspired">Vintage-inspired</option>
                    <option value="Elegant and sophisticated">Elegant and sophisticated</option>
                    <option value="Casual and comfortable">Casual and comfortable</option>
                    <option value="Eclectic mix of styles">Eclectic mix of styles</option>
                  </select>
                </div>
              </div>
              
              {/* Ambassador Experience */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-medium mb-4">Experience & Content Creation</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="soldBefore" className="block text-sm font-medium mb-1">Have you sold or promoted products before?</label>
                  <select
                    id="soldBefore"
                    name="soldBefore"
                    value={formData.soldBefore}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  >
                    <option value="Yes, professionally">Yes, professionally</option>
                    <option value="Yes, occasionally">Yes, occasionally</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="contentComfort" className="block text-sm font-medium mb-1">Comfort Level with Creating Content</label>
                  <select
                    id="contentComfort"
                    name="contentComfort"
                    value={formData.contentComfort}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  >
                    <option value="Very comfortable—I create content regularly">Very comfortable—I create content regularly</option>
                    <option value="Somewhat comfortable—I'm willing to learn">Somewhat comfortable—I'm willing to learn</option>
                    <option value="Not very comfortable—I need guidance">Not very comfortable—I need guidance</option>
                  </select>
              </div>
            </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="hasCamera" className="block text-sm font-medium mb-1">Do you have access to photography equipment?</label>
                  <select
                    id="hasCamera"
                    name="hasCamera"
                    value={formData.hasCamera}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No, just my phone">No, just my phone</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="attendEvents" className="block text-sm font-medium mb-1">Willing to attend brand events?</label>
                  <select
                    id="attendEvents"
                    name="attendEvents"
                    value={formData.attendEvents}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  >
                    <option value="Yes, definitely">Yes, definitely</option>
                    <option value="Depends">Depends</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              
              {/* Motivation & Plans */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-medium mb-4">Motivation & Promotion Plan</h2>
            </div>

              <div className="md:col-span-2">
                <div>
                  <label htmlFor="motivation" className="block text-sm font-medium mb-1">Why do you want to be an ambassador for our brand?*</label>
                  <textarea
                    id="motivation"
                    name="motivation"
                    value={formData.motivation}
                      onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2 border ${errors.motivation ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md transition-colors duration-300 bg-white dark:bg-black`}
                      required
                  ></textarea>
                  {errors.motivation && <p className="mt-1 text-sm text-red-500">{errors.motivation}</p>}
                </div>
                  </div>
              
              <div className="md:col-span-2">
                <div>
                  <label htmlFor="promotionPlan" className="block text-sm font-medium mb-1">How would you promote our products?*</label>
                  <textarea
                    id="promotionPlan"
                    name="promotionPlan"
                    value={formData.promotionPlan}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2 border ${errors.promotionPlan ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md transition-colors duration-300 bg-white dark:bg-black`}
                    required
                  ></textarea>
                  {errors.promotionPlan && <p className="mt-1 text-sm text-red-500">{errors.promotionPlan}</p>}
                </div>
              </div>
              
              {/* Investment & Agreement */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-medium mb-4">Partnership & Agreement</h2>
              </div>
              
              <div className="md:col-span-2">
                <div>
                  <label htmlFor="investmentOption" className="block text-sm font-medium mb-1">Would you be willing to invest in samples?</label>
                  <select
                    id="investmentOption"
                    name="investmentOption"
                    value={formData.investmentOption}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                  >
                    <option value="Yes, I'm prepared to purchase at ambassador prices">Yes, I'm prepared to purchase at ambassador prices</option>
                    <option value="Maybe, I need more details.">Maybe, I need more details.</option>
                    <option value="No, I'm looking for free products only">No, I'm looking for free products only</option>
                  </select>
              </div>
            </div>

              {/* Additional Information */}
              <div className="md:col-span-2">
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium mb-1">Additional Information</label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                    placeholder="Anything else you'd like to share about yourself"
                  ></textarea>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div>
                  <label htmlFor="questions" className="block text-sm font-medium mb-1">Questions for Us</label>
                  <textarea
                    id="questions"
                    name="questions"
                    value={formData.questions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md transition-colors duration-300 bg-white dark:bg-black"
                    placeholder="Any questions you have for our team"
                  ></textarea>
                </div>
              </div>
              
              {/* Terms Agreement Checkbox - Last item before submit */}
              <div className="md:col-span-2 mt-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms_checkbox"
                      name="terms_checkbox"
                      type="checkbox"
                      className={`h-4 w-4 text-black focus:ring-black border-gray-300 rounded ${!hasReadTerms ? 'cursor-not-allowed' : ''}`}
                      required
                      onClick={handleCheckboxClick}
                      disabled={!hasReadTerms}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms_checkbox" className={`font-medium ${errors.agreeToTerms ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                      I agree to the ambassador terms and conditions*
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      By checking this box, you agree to our ambassador program terms and conditions.
                      <button 
                        type="button" 
                        onClick={() => setShowTermsModal(true)}
                        className="ml-1 text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
                      >
                        Read Terms
                      </button>
                    </p>
                    {!hasReadTerms && (
                      <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                        You must read the terms and conditions before checking this box
                      </p>
                    )}
                    {errors.agreeToTerms && <p className="mt-1 text-sm text-red-500">{errors.agreeToTerms}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full md:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded transition-colors duration-300 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-900 dark:hover:bg-gray-100'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Terms and Conditions Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ambassador Terms and Conditions
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <div 
                ref={termsContentRef} 
                onScroll={handleTermsScroll}
                className="p-6 overflow-y-auto flex-1 text-gray-800 dark:text-gray-200"
              >
                <h4 className="text-lg font-semibold mb-4">1. Introduction</h4>
                <p className="mb-4">
                  Welcome to the Elevé Ambassador Program. These Terms and Conditions govern your participation in our Ambassador Program. By applying to be an Ambassador, you agree to be bound by these terms.
                </p>
                
                <h4 className="text-lg font-semibold mb-4">2. Eligibility</h4>
                <p className="mb-4">
                  To be eligible for the Elevé Ambassador Program, you must:
                </p>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                  <li>Be at least 18 years of age</li>
                  <li>Have an active social media presence</li>
                  <li>Align with our brand values and aesthetic</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
                
                <h4 className="text-lg font-semibold mb-4">3. Ambassador Responsibilities</h4>
                <p className="mb-4">
                  As an Elevé Ambassador, you are responsible for:
                </p>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                  <li>Creating high-quality content featuring our products</li>
                  <li>Promoting our products through your social media channels</li>
                  <li>Using your unique referral code in promotions</li>
                  <li>Maintaining a positive and professional image</li>
                  <li>Adhering to our brand guidelines</li>
                  <li>Disclosing your relationship with our brand in compliance with FTC guidelines</li>
                </ul>
                
                <h4 className="text-lg font-semibold mb-4">4. Program Benefits</h4>
                <p className="mb-4">
                  Ambassadors may receive:
                </p>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                  <li>Special ambassador pricing on products</li>
                  <li>Commission on sales made using your referral code</li>
                  <li>Early access to new products and collections</li>
                  <li>Exclusive ambassador-only promotions</li>
                  <li>Opportunities to be featured on our official channels</li>
                </ul>
                
                <h4 className="text-lg font-semibold mb-4">5. Term and Termination</h4>
                <p className="mb-4">
                  The Ambassador relationship is on a month-to-month basis. Either party may terminate the relationship at any time with written notice. Upon termination, you must cease using all Elevé materials and representing yourself as an Ambassador.
                </p>
                
                <h4 className="text-lg font-semibold mb-4">6. Intellectual Property</h4>
                <p className="mb-4">
                  By participating in the program, you grant Elevé a non-exclusive, royalty-free license to use, reproduce, and display any content you create in connection with the Ambassador Program. This includes the right to use your name, likeness, and social media handles for promotional purposes.
                </p>
                
                <h4 className="text-lg font-semibold mb-4">7. Confidentiality</h4>
                <p className="mb-4">
                  As an Ambassador, you may receive confidential information about our products, strategies, or business. You agree to maintain the confidentiality of this information and not disclose it to third parties.
                </p>
                
                <h4 className="text-lg font-semibold mb-4">8. Compliance with Laws</h4>
                <p className="mb-4">
                  You agree to comply with all applicable laws and regulations, including those related to advertising, privacy, and data protection. You must disclose your relationship with Elevé in all promotional content in accordance with FTC guidelines.
                </p>
                
                <h4 className="text-lg font-semibold mb-4">9. Limitation of Liability</h4>
                <p className="mb-4">
                  Elevé shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your participation in the Ambassador Program.
                </p>
                
                <h4 className="text-lg font-semibold mb-4">10. Modifications</h4>
                <p className="mb-4">
                  Elevé reserves the right to modify these Terms and Conditions at any time. Changes will be effective upon posting to our website or notification to Ambassadors.
                </p>
                
                <h4 className="text-lg font-semibold mb-4">11. Governing Law</h4>
                <p className="mb-4">
                  These Terms and Conditions shall be governed by and construed in accordance with the laws of the jurisdiction in which Elevé operates, without regard to its conflict of law provisions.
                </p>
                
                <h4 className="text-lg font-semibold mb-4">12. Acceptance</h4>
                <p className="mb-12">
                  By checking the "I agree to the ambassador terms and conditions" box, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className={`text-sm ${!termsScrolledToBottom ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  {termsScrolledToBottom 
                    ? '✓ You have read the terms to the end' 
                    : 'Please scroll to the end to accept the terms'}
                </div>
                <button
                  onClick={handleCloseTermsModal}
                  disabled={!termsScrolledToBottom}
                  className={`px-4 py-2 rounded font-medium ${
                    termsScrolledToBottom 
                      ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' 
                      : 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {termsScrolledToBottom ? 'Accept Terms' : 'Read to Accept'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
      <NewFooter />
    </>
  );
};

export default AmbassadorApplicationPage;

"use client";

import { useState, useEffect } from "react";
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
    if (formData.agreeToTerms !== 'Yes, I agree.') newErrors.agreeToTerms = 'You must agree to the terms';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        // Store current path before redirecting to sign in
        localStorage.setItem('lastPath', '/ambassador/apply');
        signIn('google', { callbackUrl: '/ambassador/apply' });
        setIsSubmitting(false);
        return;
      }
      
      // Log form data before submission
      console.log('Form data being submitted:', formData);
      
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
          userEmail: session?.user?.email || ''
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
      } else if (error.message.includes('pending ambassador application')) {
        // Redirect to the pending page
        setTimeout(() => router.push(`/ambassador/pending?email=${encodeURIComponent(formData.email)}`), 2000);
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
              
              <div className="md:col-span-2">
                <div>
                  <label htmlFor="agreeToTerms" className="block text-sm font-medium mb-1">Terms Agreement*</label>
                  <select
                    id="agreeToTerms"
                    name="agreeToTerms"
                    value={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border ${errors.agreeToTerms ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md transition-colors duration-300 bg-white dark:bg-black`}
                    required
                  >
                    <option value="Yes, I agree.">Yes, I agree to the ambassador terms and conditions</option>
                    <option value="No, I don't agree">No, I don't agree</option>
                  </select>
                  {errors.agreeToTerms && <p className="mt-1 text-sm text-red-500">{errors.agreeToTerms}</p>}
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
      </div>
      <NewFooter />
    </>
  );
};

export default AmbassadorApplicationPage;

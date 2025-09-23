import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, MapPin, Briefcase, Heart, ArrowLeft } from 'lucide-react';

interface NewHireLoginProps {
  onBack: () => void;
}

const NewHireLogin: React.FC<NewHireLoginProps> = ({ onBack }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');

  const { loginAsNewHire } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setLoading(true);
    setIsSubmitting(true);
    setError(''); // Clear any previous errors

    try {
      await loginAsNewHire(firstName, lastName, zipCode);
      
      // Clear loading states
      setLoading(false);
      setIsSubmitting(false);
      
      // Show welcome message first
      setWelcomeName(`${firstName} ${lastName}`);
      setShowWelcome(true);
      
      // Auto-proceed to main app after 3 seconds
      setTimeout(() => {
        setShowWelcome(false);
        // The auth context will handle the redirect
      }, 3000);
      
    } catch (error: any) {
      let errorMessage = 'Failed to verify credentials';
      
      if (error.message?.includes('not found') || error.message?.includes('invalid credentials')) {
        errorMessage = 'We could not find a match for the information provided. Please check your first name, last name, and ZIP code and try again.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'There was a technical issue. Please contact your administrator for assistance.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Show welcome screen after successful login
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to CareConnect!</h2>
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
              <h3 className="text-xl font-semibold text-green-800">Hello, {welcomeName}!</h3>
              <p className="text-gray-600 leading-relaxed">
                Welcome to your new hire portal. You now have access to your onboarding documents 
                and can complete your required paperwork at your own pace.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Getting Started:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Review and complete all required documents</li>
                  <li>• Upload any requested files or signatures</li>
                  <li>• Contact your administrator with any questions</li>
                </ul>
              </div>
              <div className="flex items-center justify-center pt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-3"></div>
                <span className="text-sm text-gray-600">Redirecting to your documents...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">New Hire Portal</h2>
          <p className="text-gray-600">Enter your information to access your documents</p>
        </div>

        {/* New Hire Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Unable to verify credentials</p>
                    <p className="mt-1">{error}</p>
                    <div className="mt-3 pt-2 border-t border-red-200">
                      <p className="text-xs">
                        <strong>Double-check:</strong> First name, last name, and ZIP code must match exactly as provided to your administrator.
                      </p>
                      <p className="text-xs mt-1">
                        Still having trouble? Contact your administrator for assistance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* First Name Field */}
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (error) setError(''); // Clear error when user types
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your first name"
                />
              </div>
            </div>

            {/* Last Name Field */}
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (error) setError(''); // Clear error when user types
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* ZIP Code Field */}
            <div className="space-y-2">
              <label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  autoComplete="postal-code"
                  required
                  pattern="[0-9]{5}"
                  maxLength={5}
                  value={zipCode}
                  onChange={(e) => {
                    // Only allow numbers and limit to 5 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setZipCode(value);
                    if (error) setError(''); // Clear error when user types
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your ZIP code"
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter the 5-digit ZIP code for your residence
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
            >
              {(loading || isSubmitting) ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Access Documents
                </div>
              )}
            </button>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                New Hire Information
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Enter the exact information that was provided to your administrator. 
                  All fields are case-sensitive and must match exactly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            powered by{' '}
            <span className="font-semibold text-blue-600">SYNERGY HomeCare</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewHireLogin;

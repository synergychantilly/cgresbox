import React, { useState } from 'react';
import {
  XMarkIcon,
  EnvelopeIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { NewHire } from '../../lib/newHireService';
import { newHireConversionService, ConversionResult } from '../../lib/newHireConversionService';
import { useAuth } from '../../contexts/AuthContext';

interface ConvertNewHireModalProps {
  isOpen: boolean;
  onClose: () => void;
  newHire: NewHire | null;
  onSuccess?: (result: ConversionResult) => void;
}

export default function ConvertNewHireModal({
  isOpen,
  onClose,
  newHire,
  onSuccess
}: ConvertNewHireModalProps) {
  const { userData } = useAuth();
  const [email, setEmail] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 handleSubmit called!', { newHire, userData, email });
    e.preventDefault();
    
    if (!newHire || !userData) {
      console.log('❌ Missing newHire or userData:', { newHire: !!newHire, userData: !!userData });
      return;
    }

    // Validate email
    if (!newHireConversionService.validateEmail(email)) {
      setResult({
        success: false,
        message: 'Please enter a valid email address.',
        error: 'INVALID_EMAIL'
      });
      return;
    }

    setIsConverting(true);
    setResult(null);

    try {
      const conversionResult = await newHireConversionService.convertNewHireToUser({
        newHireId: newHire.id,
        email: email.toLowerCase().trim(),
        createdBy: userData.id
      });

      setResult(conversionResult);

      if (conversionResult.success && onSuccess) {
        onSuccess(conversionResult);
      }
    } catch (error) {
      console.error('Error during conversion:', error);
      setResult({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        error: 'CONVERSION_FAILED'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setResult(null);
    setShowPreview(false);
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getResultIcon = () => {
    if (!result) return null;
    
    if (result.success) {
      return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
    } else {
      return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
    }
  };

  const emailPreview = newHire ? 
    newHireConversionService.generateEmailPreview(
      newHire.firstName, 
      newHire.lastName, 
      newHire.occupation
    ) : '';

  console.log('🔍 ConvertNewHireModal render:', { isOpen, newHire: !!newHire, userData: !!userData });
  
  if (!isOpen || !newHire) {
    console.log('🚫 Modal not rendering:', { isOpen, newHire: !!newHire });
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserPlusIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Convert New Hire to User
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* New Hire Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">New Hire Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{newHire.firstName} {newHire.lastName}</span>
              </div>
              <div>
                <span className="text-gray-600">Occupation:</span>
                <span className="ml-2 font-medium">{newHire.occupation}</span>
              </div>
              <div>
                <span className="text-gray-600">Zip Code:</span>
                <span className="ml-2 font-medium">{newHire.zipCode}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 font-medium">{newHire.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {!result ? (
            // Conversion Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address for {newHire.firstName} {newHire.lastName}
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address..."
                    required
                    disabled={isConverting}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  A registration email will be sent to this address
                </p>
              </div>

              {/* Email Preview Toggle */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center text-blue-700 hover:text-blue-800 font-medium"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {showPreview ? 'Hide' : 'Preview'} Email Content
                </button>
                
                {showPreview && (
                  <div className="mt-3 bg-white border border-blue-200 rounded p-3">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {emailPreview}
                    </pre>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Before converting:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure the email address is correct and accessible by the new hire</li>
                      <li>The registration link will be valid for 7 days</li>
                      <li>The new hire will need to complete registration and wait for admin approval</li>
                      <li>Once converted, they'll lose access to the temporary new hire system</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isConverting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting || !email.trim()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => console.log('🔘 Button clicked!', { isConverting, email: email.trim(), disabled: isConverting || !email.trim() })}
                >
                  {isConverting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      Convert & Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Result Display
            <div className="space-y-4">
              <div className={`flex items-start p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="mr-3 mt-0.5">
                  {getResultIcon()}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Conversion Successful!' : 'Conversion Failed'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </div>

              {/* Show registration details if successful */}
              {result.success && result.registrationLink && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Registration Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Link
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={result.registrationLink}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded"
                        />
                        <button
                          onClick={() => copyToClipboard(result.registrationLink!)}
                          className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          title="Copy to clipboard"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {result.registrationToken && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration Token
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={result.registrationToken}
                            readOnly
                            className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded font-mono"
                          />
                          <button
                            onClick={() => copyToClipboard(result.registrationToken!)}
                            className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                            title="Copy to clipboard"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

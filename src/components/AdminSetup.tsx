import React, { useState } from 'react';
import { createAdminUser } from '../lib/adminSetup';
import { Shield, CheckCircle, AlertCircle, Terminal } from 'lucide-react';

const AdminSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateAdmin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await createAdminUser();
      setResult(response);
    } catch (error) {
      console.error('Error creating admin:', error);
      setResult({
        success: false,
        message: 'Unexpected error occurred',
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Admin Setup Required</h2>
            <p className="text-gray-600">
              No admin user found. Create the default admin account to get started.
            </p>
          </div>

          {/* Admin Details */}
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-medium text-gray-900 mb-2">Default Admin Account:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Email:</span> hashimosman@synergyhomecare.com</p>
              <p><span className="font-medium">Password:</span> Princess@2025</p>
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <span className="text-sm font-medium">{result.message}</span>
              </div>
            </div>
          )}

          {/* Create Admin Button */}
          <button
            onClick={handleCreateAdmin}
            disabled={loading || (result && result.success)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Admin...
              </div>
            ) : result && result.success ? (
              'Admin Created Successfully!'
            ) : (
              'Create Admin User'
            )}
          </button>

          {/* Alternative Method */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Terminal className="h-4 w-4 mr-2" />
              Alternative: Browser Console
            </div>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono text-left">
              createAdminUser()
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Open browser developer tools and run the command above
            </p>
          </div>

          {/* Success Actions */}
          {result && result.success && (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              Continue to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;

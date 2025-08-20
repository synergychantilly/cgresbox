import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Mail, RefreshCw } from 'lucide-react';

const PendingApproval: React.FC = () => {
  const { userData, logout, refreshUserData } = useAuth();

  const handleRefresh = async () => {
    await refreshUserData();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-white" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Account Pending Approval</h2>
            <p className="text-gray-600">
              Hello <span className="font-medium">{userData?.name}</span>! Your account has been created successfully and is currently pending approval from an administrator.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <div className="flex items-center mb-2">
                <Mail className="h-4 w-4 mr-2" />
                <span className="font-medium">What happens next?</span>
              </div>
              <ul className="space-y-1 text-left">
                <li>• An administrator will review your account</li>
                <li>• You'll receive an email notification once approved</li>
                <li>• You can then access all CareConnect features</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              Sign Out
            </button>
          </div>

          {/* Support */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact your administrator or IT support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

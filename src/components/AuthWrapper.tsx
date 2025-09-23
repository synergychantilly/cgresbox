import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import Register from './Register';
import PendingApproval from './PendingApproval';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { currentUser, userData, newHireSession, loading, isNewHire } = useAuth();

  // Debug logging
  console.log('🔍 AuthWrapper: Current state', {
    loading,
    isNewHire,
    hasCurrentUser: !!currentUser,
    hasUserData: !!userData,
    hasNewHireSession: !!newHireSession,
    userStatus: userData?.status
  });

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  if (loading) {
    console.log('⏳ AuthWrapper: Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If new hire is authenticated, show the main app (they have restricted access)
  if (isNewHire && newHireSession) {
    console.log('🆕 AuthWrapper: New hire authenticated, showing main app');
    return <>{children}</>;
  }

  // If no user is authenticated, show login/register
  if (!currentUser || !userData) {
    console.log('👤 AuthWrapper: No user authenticated, showing login/register');
    return isLoginMode ? (
      <Login onToggleMode={toggleMode} />
    ) : (
      <Register onToggleMode={toggleMode} />
    );
  }

  // If user is authenticated but not approved, show pending approval
  if (userData.status === 'pending') {
    console.log('⏳ AuthWrapper: User pending approval');
    return <PendingApproval />;
  }

  // If user is disabled, show disabled message
  if (userData.status === 'disabled') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Account Disabled</h2>
              <p className="text-gray-600">
                Your account has been disabled by an administrator. Please contact support for assistance.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is approved, show the main app
  console.log('✅ AuthWrapper: User approved, showing main app');
  return <>{children}</>;
};

export default AuthWrapper;

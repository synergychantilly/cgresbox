import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
  const { currentUser, userData, isAdmin, isApproved } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold text-lg mb-2">🔍 Auth Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Authenticated:</strong> {currentUser ? '✅ Yes' : '❌ No'}
        </div>
        
        {currentUser && (
          <>
            <div>
              <strong>User ID:</strong> {currentUser.uid}
            </div>
            <div>
              <strong>Email:</strong> {currentUser.email}
            </div>
          </>
        )}
        
        {userData ? (
          <>
            <div>
              <strong>Name:</strong> {userData.name}
            </div>
            <div>
              <strong>Role:</strong> {userData.role}
            </div>
            <div>
              <strong>Status:</strong> {userData.status}
            </div>
            <div>
              <strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Is Approved:</strong> {isApproved ? '✅ Yes' : '❌ No'}
            </div>
          </>
        ) : (
          <div className="text-red-600">❌ No user data found</div>
        )}

        {!userData && currentUser && (
          <div className="text-orange-600 text-xs">
            ⚠️ User authenticated but no Firestore document found
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>Debug Actions (Console):</strong>
          <br />• checkAdminUserDocument()
          <br />• createAdminUser()
        </div>
      </div>
    </div>
  );
}



import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';
import { NewHireSession, verifyNewHire, createNewHireSession, getNewHireSession } from '../lib/newHireService';
import { convertNewHireToActiveUser } from '../lib/newHireConversionService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  newHireSession: NewHireSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginAsNewHire: (firstName: string, lastName: string, zipCode: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
  isNewHire: boolean;
  isMasterAdmin: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [newHireSession, setNewHireSession] = useState<NewHireSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          avatar: data.avatar,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt?.toDate(),
          questionsAskedToday: data.questionsAskedToday || 0,
          lastQuestionDate: data.lastQuestionDate?.toDate()
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      const userData = await fetchUserData(currentUser.uid);
      setUserData(userData);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(result.user.uid);
      
      if (userData) {
        // Update last login time
        await updateDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: serverTimestamp()
        });
        setUserData(userData);
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const newUser: User = {
        id: result.user.uid,
        name,
        email,
        role: 'user',
        status: 'pending',
        createdAt: new Date(),
        questionsAskedToday: 0
      };

      await setDoc(doc(db, 'users', result.user.uid), {
        ...newUser,
        createdAt: serverTimestamp()
      });

      // Check for new hire conversion
      try {
        console.log('🔄 Checking for new hire conversion during registration');
        const conversionResult = await convertNewHireToActiveUser(email, result.user.uid, name);
        
        if (conversionResult.success && conversionResult.convertedFromNewHire) {
          console.log('✅ New hire converted to active user:', {
            originalNewHire: conversionResult.newHireData?.firstName + ' ' + conversionResult.newHireData?.lastName,
            transferredDocuments: conversionResult.transferredDocuments
          });
          
          // Refresh user data to include the updated information
          const updatedUserData = await fetchUserData(result.user.uid);
          if (updatedUserData) {
            setUserData(updatedUserData);
          } else {
            setUserData(newUser);
          }
        } else {
          setUserData(newUser);
        }
      } catch (conversionError) {
        console.error('Error during new hire conversion:', conversionError);
        // Don't fail registration if conversion fails
        setUserData(newUser);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsNewHire = async (firstName: string, lastName: string, zipCode: string) => {
    setLoading(true);
    try {
      const newHire = await verifyNewHire(firstName, lastName, zipCode);
      if (!newHire) {
        throw new Error('New hire not found or invalid credentials');
      }
      
      const sessionId = await createNewHireSession(newHire);
      const session = await getNewHireSession(sessionId);
      
      if (!session) {
        throw new Error('Failed to create new hire session');
      }
      
      setNewHireSession(session);
      // Store session ID in localStorage for persistence
      localStorage.setItem('newHireSessionId', sessionId);
    } catch (error) {
      console.error('New hire login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await firebaseSignOut(auth);
      }
      setCurrentUser(null);
      setUserData(null);
      setNewHireSession(null);
      // Clear new hire session from localStorage
      localStorage.removeItem('newHireSessionId');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Initialize the default admin user
  const initializeAdminUser = async () => {
    // Don't try to check Firestore when not authenticated as it will fail due to security rules
    // Instead, just make the admin creation function available
    console.log('%c🔧 CareConnect Admin Setup', 'color: #3B82F6; font-size: 16px; font-weight: bold;');
    console.log('%cTo create the admin user, run:', 'color: #059669; font-weight: bold;');
    console.log('%ccreateAdminUser()', 'background: #F3F4F6; color: #1F2937; padding: 4px 8px; border-radius: 4px; font-family: monospace;');
    console.log('%cOr create manually in Firebase Console Authentication section', 'color: #6B7280;');
  };

  useEffect(() => {
    console.log('🔄 AuthContext: Starting authentication check');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 AuthContext: Auth state changed', user ? 'User logged in' : 'No user');
      setCurrentUser(user);
      
      if (user) {
        const userData = await fetchUserData(user.uid);
        setUserData(userData);
        console.log('👤 AuthContext: User data loaded', userData?.name);
      } else {
        setUserData(null);
        console.log('👤 AuthContext: No user data');
      }
      
      setLoading(false);
      console.log('✅ AuthContext: Loading set to false (auth state change)');
    });

    // Check for existing new hire session
    const checkNewHireSession = async () => {
      console.log('🆕 AuthContext: Checking for new hire session');
      const sessionId = localStorage.getItem('newHireSessionId');
      if (sessionId) {
        console.log('🔍 AuthContext: Found session ID in localStorage', sessionId);
        try {
          const session = await getNewHireSession(sessionId);
          if (session) {
            console.log('✅ AuthContext: Valid new hire session found', session.firstName, session.lastName);
            setNewHireSession(session);
          } else {
            console.log('❌ AuthContext: Invalid session, removing from localStorage');
            localStorage.removeItem('newHireSessionId');
          }
        } catch (error) {
          console.error('❌ AuthContext: Error checking new hire session:', error);
          localStorage.removeItem('newHireSessionId');
        }
      } else {
        console.log('🔍 AuthContext: No session ID found in localStorage');
      }
      setLoading(false);
      console.log('✅ AuthContext: Loading set to false (new hire check)');
    };

    // Check for admin user on first load
    initializeAdminUser();

    // Check authentication status
    if (!auth.currentUser) {
      console.log('🔍 AuthContext: No Firebase user, checking for new hire session');
      checkNewHireSession();
    } else {
      console.log('🔍 AuthContext: Firebase user exists, loading complete');
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === 'admin';
  const isApproved = userData?.status === 'approved';
  const isNewHire = newHireSession !== null;
  const isMasterAdmin = userData?.email?.toLowerCase() === 'hashimosman@synergyhomecare.com';

  const value: AuthContextType = {
    currentUser,
    userData,
    newHireSession,
    loading,
    login,
    register,
    loginAsNewHire,
    logout,
    isAdmin,
    isApproved,
    isNewHire,
    isMasterAdmin,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

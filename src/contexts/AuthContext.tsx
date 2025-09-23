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

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
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

      setUserData(newUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserData(null);
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userData = await fetchUserData(user.uid);
        setUserData(userData);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Check for admin user on first load
    initializeAdminUser();

    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === 'admin';
  const isApproved = userData?.status === 'approved';

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isApproved,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

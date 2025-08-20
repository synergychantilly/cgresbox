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
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, birthday?: Date) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isMasterAdmin: boolean;
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
        const isMasterAdmin = await checkMasterAdmin(data.email);
        
        return {
          id: userDoc.id,
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          avatar: data.avatar,
          birthday: data.birthday?.toDate(),
          isMasterAdmin,
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
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address. Would you like to create an account?');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please check your password and try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact an administrator.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/invalid-login-credentials') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/missing-password') {
        throw new Error('Please enter your password.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else {
        console.error('Unhandled auth error code:', error.code);
        throw new Error(error.message || 'Failed to log in. Please try again.');
      }
    }
  };

  const register = async (email: string, password: string, name: string, birthday?: Date) => {
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
        questionsAskedToday: 0,
        ...(birthday && { birthday })
      };

      const userDoc: any = {
        ...newUser,
        createdAt: serverTimestamp()
      };

      if (birthday) {
        userDoc.birthday = Timestamp.fromDate(birthday);
      }

      await setDoc(doc(db, 'users', result.user.uid), userDoc);

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

  // Master admin check - Hashim Osman is the master admin
  const checkMasterAdmin = async (email: string) => {
    const MASTER_ADMIN_EMAIL = 'hashimosman@synergyhomecare.com';
    return email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
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

    // Master admin is already configured - no console setup needed

    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === 'admin';
  const isMasterAdmin = userData?.isMasterAdmin === true;
  const isApproved = userData?.status === 'approved';

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isMasterAdmin,
    isApproved,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

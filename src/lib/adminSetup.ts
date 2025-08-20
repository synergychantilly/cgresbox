import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, query, collection, where, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

/**
 * Manual function to create the admin user if it doesn't exist
 * This can be called from the browser console if needed
 */
export const createAdminUser = async () => {
  try {
    console.log('🚀 Creating admin user...');
    
    // Try to create admin user with Firebase Auth
    const adminResult = await createUserWithEmailAndPassword(
      auth, 
      'hashimosman@synergyhomecare.com', 
      'Princess@2025'
    );
    
    console.log('✅ Admin user created in Firebase Auth with UID:', adminResult.user.uid);
    
    // Create admin user document in Firestore
    const adminUser: Omit<User, 'id'> = {
      name: 'Hashim Osman',
      email: 'hashimosman@synergyhomecare.com',
      role: 'admin',
      status: 'approved',
      createdAt: new Date(),
      questionsAskedToday: 0
    };

    await setDoc(doc(db, 'users', adminResult.user.uid), {
      ...adminUser,
      createdAt: serverTimestamp()
    });

    console.log('✅ Admin user document created in Firestore');
    console.log('🎉 Admin setup complete! You can now login with:');
    console.log('📧 Email: hashimosman@synergyhomecare.com');
    console.log('🔑 Password: Princess@2025');
    
    return { 
      success: true, 
      message: 'Admin user created successfully! You can now login.',
      uid: adminResult.user.uid 
    };
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
    
    // If user already exists in Auth
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user already exists in Firebase Auth');
      console.log('🔧 Try logging in, or check Firebase Console if there are issues');
      return { 
        success: true, 
        message: 'Admin user already exists. Try logging in with the credentials.',
        error: error.code
      };
    }
    
    // Handle other auth errors
    if (error.code === 'auth/weak-password') {
      return { 
        success: false, 
        message: 'Password is too weak. Please use a stronger password.',
        error: error.code 
      };
    }
    
    if (error.code === 'auth/invalid-email') {
      return { 
        success: false, 
        message: 'Invalid email address format.',
        error: error.code 
      };
    }
    
    return { 
      success: false, 
      message: `Failed to create admin user: ${error.message}`,
      error: error.code 
    };
  }
};

// Function to create admin user document if it's missing
export const createAdminUserDocument = async () => {
  try {
    console.log('🔧 Creating admin user document...');
    
    const adminUid = 'tUIUWxgQXaXiWfCPJD3hjB4Si0O2'; // UID from Firebase Auth
    
    // Create admin user document in Firestore
    const adminUser: Omit<User, 'id'> = {
      name: 'Hashim Osman',
      email: 'hashimosman@synergyhomecare.com',
      role: 'admin',
      status: 'approved',
      createdAt: new Date(),
      questionsAskedToday: 0
    };

    await setDoc(doc(db, 'users', adminUid), {
      ...adminUser,
      createdAt: serverTimestamp()
    });

    console.log('✅ Admin user document created in Firestore');
    console.log('🎉 You can now login with:');
    console.log('📧 Email: hashimosman@synergyhomecare.com');
    console.log('🔑 Password: Princess@2025');
    
    return { 
      success: true, 
      message: 'Admin user document created successfully!',
      uid: adminUid 
    };
    
  } catch (error: any) {
    console.error('❌ Error creating admin user document:', error);
    return { 
      success: false, 
      message: `Failed to create admin user document: ${error.message}`,
      error: error.code 
    };
  }
};

// Function to check if admin user document exists
export const checkAdminUserDocument = async () => {
  try {
    const adminUid = 'tUIUWxgQXaXiWfCPJD3hjB4Si0O2';
    const userDoc = await getDoc(doc(db, 'users', adminUid));
    
    if (userDoc.exists()) {
      console.log('✅ Admin user document exists:', userDoc.data());
      return { exists: true, data: userDoc.data() };
    } else {
      console.log('❌ Admin user document does not exist');
      return { exists: false };
    }
  } catch (error: any) {
    console.error('Error checking admin user document:', error);
    return { exists: false, error: error.message };
  }
};

// Make the functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).createAdminUser = createAdminUser;
  (window as any).createAdminUserDocument = createAdminUserDocument;
  (window as any).checkAdminUserDocument = checkAdminUserDocument;
}

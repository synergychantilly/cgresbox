import { 
  collection, 
  doc, 
  addDoc,
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface NewHire {
  id: string;
  firstName: string;
  lastName: string;
  zipCode: string;
  occupation: string;
  createdAt: Date;
  createdBy: string; // Admin who added them
  isActive: boolean;
  lastAccessAt?: Date;
}

export interface NewHireSession {
  id: string;
  newHireId: string;
  firstName: string;
  lastName: string;
  occupation: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

// Add a new hire (Admin only)
export const addNewHire = async (
  firstName: string, 
  lastName: string, 
  zipCode: string, 
  occupation: string, 
  createdBy: string
): Promise<string> => {
  try {
    const newHireData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      zipCode: zipCode.trim(),
      occupation: occupation.trim(),
      createdAt: serverTimestamp(),
      createdBy,
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'newHires'), newHireData);
    console.log(`New hire added: ${firstName} ${lastName} with ID ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error adding new hire:', error);
    throw error;
  }
};

// Get all new hires (Admin only)
export const getNewHires = async (): Promise<NewHire[]> => {
  try {
    const q = query(
      collection(db, 'newHires'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        zipCode: data.zipCode,
        occupation: data.occupation,
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        isActive: data.isActive ?? true,
        lastAccessAt: data.lastAccessAt?.toDate()
      } as NewHire;
    });
  } catch (error) {
    console.error('Error fetching new hires:', error);
    throw error;
  }
};

// Verify new hire credentials
export const verifyNewHire = async (
  firstName: string, 
  lastName: string, 
  zipCode: string
): Promise<NewHire | null> => {
  try {
    console.log('🔍 Verifying new hire credentials:', { firstName, lastName, zipCode });
    
    // Get all new hires and filter client-side to avoid query permission issues
    const querySnapshot = await getDocs(collection(db, 'newHires'));
    
    console.log('📊 Found', querySnapshot.docs.length, 'new hire records');
    
    // Filter results client-side for exact match (only active new hires)
    const matchingDoc = querySnapshot.docs.find(doc => {
      const data = doc.data();
      const isMatch = (data.isActive === true) &&
             data.firstName === firstName.trim() && 
             data.lastName === lastName.trim() && 
             data.zipCode === zipCode.trim();
      
      if (isMatch) {
        console.log('✅ Found matching new hire:', data.firstName, data.lastName);
      }
      
      return isMatch;
    });
    
    if (!matchingDoc) {
      console.log('❌ No matching new hire found');
      return null;
    }

    // Return the match
    const data = matchingDoc.data();
    
    const newHire = {
      id: matchingDoc.id,
      firstName: data.firstName,
      lastName: data.lastName,
      zipCode: data.zipCode,
      occupation: data.occupation,
      createdAt: data.createdAt?.toDate() || new Date(),
      createdBy: data.createdBy,
      isActive: data.isActive ?? true,
      lastAccessAt: data.lastAccessAt?.toDate()
    } as NewHire;
    
    console.log('🎉 New hire verified successfully:', newHire.firstName, newHire.lastName);
    return newHire;
  } catch (error) {
    console.error('❌ Error verifying new hire:', error);
    throw error;
  }
};

// Update new hire last access time (admin only - requires authentication)
export const updateNewHireLastAccess = async (newHireId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'newHires', newHireId), {
      lastAccessAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating new hire last access:', error);
    throw error;
  }
};

// Create new hire session
export const createNewHireSession = async (newHire: NewHire): Promise<string> => {
  try {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 8); // 8-hour session

    const sessionData = {
      newHireId: newHire.id,
      firstName: newHire.firstName,
      lastName: newHire.lastName,
      occupation: newHire.occupation,
      createdAt: serverTimestamp(),
      expiresAt: expirationTime,
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'newHireSessions'), sessionData);
    
    // Note: Last access time will be updated by admin operations only
    // New hires cannot update their own records due to authentication constraints
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating new hire session:', error);
    throw error;
  }
};

// Get new hire session
export const getNewHireSession = async (sessionId: string): Promise<NewHireSession | null> => {
  try {
    const docRef = doc(db, 'newHireSessions', sessionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const session = {
      id: docSnap.id,
      newHireId: data.newHireId,
      firstName: data.firstName,
      lastName: data.lastName,
      occupation: data.occupation,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      isActive: data.isActive ?? true
    } as NewHireSession;

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await updateDoc(docRef, { isActive: false });
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error fetching new hire session:', error);
    return null;
  }
};

// Update new hire (Admin only)
export const updateNewHire = async (
  id: string,
  updates: Partial<Pick<NewHire, 'firstName' | 'lastName' | 'zipCode' | 'occupation' | 'isActive'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'newHires', id);
    await updateDoc(docRef, updates);
    console.log(`New hire ${id} updated`);
  } catch (error) {
    console.error('Error updating new hire:', error);
    throw error;
  }
};

// Delete new hire (Admin only)
export const deleteNewHire = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'newHires', id));
    console.log(`New hire ${id} deleted`);
  } catch (error) {
    console.error('Error deleting new hire:', error);
    throw error;
  }
};

// Subscribe to new hires for real-time updates (Admin only)
export const subscribeToNewHires = (callback: (newHires: NewHire[]) => void) => {
  const q = query(
    collection(db, 'newHires'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const newHires = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        zipCode: data.zipCode,
        occupation: data.occupation,
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        isActive: data.isActive ?? true,
        lastAccessAt: data.lastAccessAt?.toDate()
      } as NewHire;
    });
    callback(newHires);
  });
};

// Deactivate new hire (soft delete)
export const deactivateNewHire = async (id: string): Promise<void> => {
  try {
    await updateNewHire(id, { isActive: false });
    console.log(`New hire ${id} deactivated`);
  } catch (error) {
    console.error('Error deactivating new hire:', error);
    throw error;
  }
};

// Reactivate new hire
export const reactivateNewHire = async (id: string): Promise<void> => {
  try {
    await updateNewHire(id, { isActive: true });
    console.log(`New hire ${id} reactivated`);
  } catch (error) {
    console.error('Error reactivating new hire:', error);
    throw error;
  }
};

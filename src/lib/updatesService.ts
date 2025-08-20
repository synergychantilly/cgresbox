import { 
  collection, 
  doc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Update, UpdateType, CreateUpdateData, UpdateUpdateData } from '../types/updates';

const COLLECTION_NAME = 'announcements';

// Helper function to check if update is active (not expired)
const isUpdateActive = (expiration?: Date): boolean => {
  if (!expiration) return true;
  return new Date() <= expiration;
};

// Create a new update
export const createUpdate = async (
  updateData: CreateUpdateData, 
  createdBy: string
): Promise<string> => {
  try {
    const docData: any = {
      ...updateData,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Convert expiration to Timestamp if provided
    if (updateData.expiration) {
      docData.expiration = Timestamp.fromDate(updateData.expiration);
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

    console.log('Update created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating update:', error);
    throw error;
  }
};

// Update an existing update
export const updateUpdate = async (
  updateId: string, 
  updateData: UpdateUpdateData
): Promise<void> => {
  try {
    const updateFields: any = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    // Convert expiration to Timestamp if provided
    if (updateData.expiration) {
      updateFields.expiration = Timestamp.fromDate(updateData.expiration);
    }

    await updateDoc(doc(db, COLLECTION_NAME, updateId), updateFields);
    console.log('Update updated:', updateId);
  } catch (error) {
    console.error('Error updating update:', error);
    throw error;
  }
};

// Delete an update
export const deleteUpdate = async (updateId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, updateId));
    console.log('Update deleted:', updateId);
  } catch (error) {
    console.error('Error deleting update:', error);
    throw error;
  }
};

// Get all updates (including expired ones)
export const getAllUpdates = async (): Promise<Update[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const expiration = data.expiration?.toDate();
      
      return {
        id: doc.id,
        title: data.title,
        type: data.type as UpdateType,
        description: data.description,
        expiration,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: isUpdateActive(expiration)
      } as Update;
    });
  } catch (error) {
    console.error('Error fetching updates:', error);
    throw error;
  }
};

// Get only active updates (not expired)
export const getActiveUpdates = async (): Promise<Update[]> => {
  try {
    const allUpdates = await getAllUpdates();
    return allUpdates.filter(update => update.isActive);
  } catch (error) {
    console.error('Error fetching active updates:', error);
    throw error;
  }
};

// Get updates by type
export const getUpdatesByType = async (type: UpdateType): Promise<Update[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const expiration = data.expiration?.toDate();
      
      return {
        id: doc.id,
        title: data.title,
        type: data.type as UpdateType,
        description: data.description,
        expiration,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: isUpdateActive(expiration)
      } as Update;
    });
  } catch (error) {
    console.error('Error fetching updates by type:', error);
    throw error;
  }
};

// Get active updates by type
export const getActiveUpdatesByType = async (type: UpdateType): Promise<Update[]> => {
  try {
    const updates = await getUpdatesByType(type);
    return updates.filter(update => update.isActive);
  } catch (error) {
    console.error('Error fetching active updates by type:', error);
    throw error;
  }
};

// Get a specific update by ID
export const getUpdateById = async (updateId: string): Promise<Update | null> => {
  try {
    const updateDoc = await getDoc(doc(db, COLLECTION_NAME, updateId));
    if (updateDoc.exists()) {
      const data = updateDoc.data();
      const expiration = data.expiration?.toDate();
      
      return {
        id: updateDoc.id,
        title: data.title,
        type: data.type as UpdateType,
        description: data.description,
        expiration,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: isUpdateActive(expiration)
      } as Update;
    }
    return null;
  } catch (error) {
    console.error('Error fetching update:', error);
    throw error;
  }
};

// Subscribe to all updates for real-time updates
export const subscribeToAllUpdates = (callback: (updates: Update[]) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const updates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const expiration = data.expiration?.toDate();
      
      return {
        id: doc.id,
        title: data.title,
        type: data.type as UpdateType,
        description: data.description,
        expiration,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: isUpdateActive(expiration)
      } as Update;
    });
    callback(updates);
  });
};

// Subscribe to active updates only
export const subscribeToActiveUpdates = (callback: (updates: Update[]) => void) => {
  return subscribeToAllUpdates((updates) => {
    const activeUpdates = updates.filter(update => update.isActive);
    callback(activeUpdates);
  });
};

// Subscribe to updates by type
export const subscribeToUpdatesByType = (
  type: UpdateType, 
  callback: (updates: Update[]) => void
) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('type', '==', type),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const updates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const expiration = data.expiration?.toDate();
      
      return {
        id: doc.id,
        title: data.title,
        type: data.type as UpdateType,
        description: data.description,
        expiration,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: isUpdateActive(expiration)
      } as Update;
    });
    callback(updates);
  });
};

// Get recent updates (last 30 days)
export const getRecentUpdates = async (days: number = 30): Promise<Update[]> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('createdAt', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const expiration = data.expiration?.toDate();
      
      return {
        id: doc.id,
        title: data.title,
        type: data.type as UpdateType,
        description: data.description,
        expiration,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: isUpdateActive(expiration)
      } as Update;
    });
  } catch (error) {
    console.error('Error fetching recent updates:', error);
    throw error;
  }
};

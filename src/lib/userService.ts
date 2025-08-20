import { 
  collection, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export interface UserAction {
  id: string;
  userId: string;
  action: 'approved' | 'disabled' | 'enabled';
  performedBy: string;
  performedAt: Date;
  reason?: string;
}

// Approve a user account
export const approveUser = async (userId: string, approvedBy: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'approved',
      approvedBy,
      approvedAt: serverTimestamp()
    });

    // Log the action
    await logUserAction(userId, 'approved', approvedBy);
    
    console.log(`User ${userId} approved by ${approvedBy}`);
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
};

// Disable a user account
export const disableUser = async (userId: string, disabledBy: string, reason?: string): Promise<void> => {
  try {
    const updateData: any = {
      status: 'disabled',
      disabledBy,
      disabledAt: serverTimestamp()
    };

    // Only add disabledReason if it's provided (not undefined)
    if (reason !== undefined && reason !== null && reason.trim() !== '') {
      updateData.disabledReason = reason;
    }

    await updateDoc(doc(db, 'users', userId), updateData);

    // Log the action
    await logUserAction(userId, 'disabled', disabledBy, reason);
    
    console.log(`User ${userId} disabled by ${disabledBy}`);
  } catch (error) {
    console.error('Error disabling user:', error);
    throw error;
  }
};

// Enable a previously disabled user
export const enableUser = async (userId: string, enabledBy: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'approved',
      enabledBy,
      enabledAt: serverTimestamp()
      // Note: We don't set disabled fields to null, just leave them as is for audit trail
    });

    // Log the action
    await logUserAction(userId, 'enabled', enabledBy);
    
    console.log(`User ${userId} enabled by ${enabledBy}`);
  } catch (error) {
    console.error('Error enabling user:', error);
    throw error;
  }
};

// Get all pending users
export const getPendingUsers = async (): Promise<User[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
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
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    throw error;
  }
};

// Get all users with filtering options
export const getUsers = async (statusFilter?: 'pending' | 'approved' | 'disabled'): Promise<User[]> => {
  try {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    if (statusFilter) {
      q = query(
        collection(db, 'users'),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
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
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get a specific user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
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
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Subscribe to pending users for real-time updates
export const subscribeToPendingUsers = (callback: (users: User[]) => void) => {
  const q = query(
    collection(db, 'users'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
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
    });
    callback(users);
  });
};

// Log user actions for audit trail
const logUserAction = async (userId: string, action: 'approved' | 'disabled' | 'enabled', performedBy: string, reason?: string): Promise<void> => {
  try {
    const actionData: any = {
      userId,
      action,
      performedBy,
      performedAt: serverTimestamp()
    };

    // Only add reason if it's provided (not undefined)
    if (reason !== undefined && reason !== null && reason.trim() !== '') {
      actionData.reason = reason;
    }

    await updateDoc(doc(db, 'userActions', `${userId}_${Date.now()}`), actionData);
  } catch (error) {
    console.error('Error logging user action:', error);
    // Don't throw error for logging failures
  }
};

// Check if user can ask a question today (max 1 per day)
export const canUserAskQuestion = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    const lastQuestionDate = userData.lastQuestionDate?.toDate();
    const questionsAskedToday = userData.questionsAskedToday || 0;

    // Check if it's a new day
    const today = new Date();
    const isNewDay = !lastQuestionDate || 
      lastQuestionDate.toDateString() !== today.toDateString();

    if (isNewDay) {
      // Reset counter for new day
      await updateDoc(doc(db, 'users', userId), {
        questionsAskedToday: 0,
        lastQuestionDate: serverTimestamp()
      });
      return true;
    }

    return questionsAskedToday < 1;
  } catch (error) {
    console.error('Error checking question limit:', error);
    return false;
  }
};

// Increment question count for user
export const incrementUserQuestionCount = async (userId: string): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const questionsAskedToday = userData.questionsAskedToday || 0;

    await updateDoc(doc(db, 'users', userId), {
      questionsAskedToday: questionsAskedToday + 1,
      lastQuestionDate: serverTimestamp()
    });
  } catch (error) {
    console.error('Error incrementing question count:', error);
    throw error;
  }
};

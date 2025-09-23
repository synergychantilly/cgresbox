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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';
import { createBirthdayEvent, removeBirthdayEventsByName } from './calendarService';
import { userDocumentService } from './documentsService';

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
    // Get user data to check for birthday
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    await updateDoc(doc(db, 'users', userId), {
      status: 'approved',
      approvedBy,
      approvedAt: serverTimestamp()
    });

    // Create birthday calendar event if user has a birthday
    if (userData?.birthday && userData?.name) {
      try {
        await createBirthdayEvent(userId, userData.name, userData.birthday.toDate(), approvedBy);
        console.log(`Birthday event created for ${userData.name}`);
      } catch (birthdayError) {
        console.error('Error creating birthday event:', birthdayError);
        // Don't fail the approval if birthday event creation fails
      }
    }

    // Initialize user documents for all existing templates
    if (userData?.name) {
      try {
        await userDocumentService.initializeForUser(userId, userData.name);
        console.log(`Document tracking initialized for ${userData.name}`);
      } catch (docError) {
        console.error('Error initializing user documents:', docError);
        // Don't fail the approval if document initialization fails
      }
    }

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
    // Get user data to remove birthday events
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

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

    // Remove birthday calendar events if user has them
    if (userData?.name) {
      try {
        await removeBirthdayEventsByName(userData.name);
        console.log(`Birthday events removed for ${userData.name}`);
      } catch (birthdayError) {
        console.error('Error removing birthday events:', birthdayError);
        // Don't fail the disable if birthday event removal fails
      }
    }

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
    // Get user data to recreate birthday events
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    await updateDoc(doc(db, 'users', userId), {
      status: 'approved',
      enabledBy,
      enabledAt: serverTimestamp()
      // Note: We don't set disabled fields to null, just leave them as is for audit trail
    });

    // Recreate birthday calendar event if user has a birthday
    if (userData?.birthday && userData?.name) {
      try {
        await createBirthdayEvent(userId, userData.name, userData.birthday.toDate(), enabledBy);
        console.log(`Birthday event recreated for ${userData.name}`);
      } catch (birthdayError) {
        console.error('Error recreating birthday event:', birthdayError);
        // Don't fail the enable if birthday event creation fails
      }
    }

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
        birthday: data.birthday?.toDate(),
        isMasterAdmin: data.email?.toLowerCase() === 'hashimosman@synergyhomecare.com',
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
        birthday: data.birthday?.toDate(),
        isMasterAdmin: data.email?.toLowerCase() === 'hashimosman@synergyhomecare.com',
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
        birthday: data.birthday?.toDate(),
        isMasterAdmin: data.email?.toLowerCase() === 'hashimosman@synergyhomecare.com',
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
        birthday: data.birthday?.toDate(),
        isMasterAdmin: data.email?.toLowerCase() === 'hashimosman@synergyhomecare.com',
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

// Subscribe to all users for real-time updates
export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const q = query(
    collection(db, 'users'),
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
        birthday: data.birthday?.toDate(),
        isMasterAdmin: data.email?.toLowerCase() === 'hashimosman@synergyhomecare.com',
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

// Promote user to admin (Master Admin only)
export const promoteToAdmin = async (userId: string, promotedBy: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
      promotedBy,
      promotedAt: serverTimestamp()
    });

    // Log the action
    await logUserAction(userId, 'promoted' as any, promotedBy);
    
    console.log(`User ${userId} promoted to admin by ${promotedBy}`);
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw error;
  }
};

// Demote admin to user (Master Admin only)
export const demoteFromAdmin = async (userId: string, demotedBy: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: 'user',
      demotedBy,
      demotedAt: serverTimestamp()
    });

    // Log the action
    await logUserAction(userId, 'demoted' as any, demotedBy);
    
    console.log(`User ${userId} demoted from admin by ${demotedBy}`);
  } catch (error) {
    console.error('Error demoting user from admin:', error);
    throw error;
  }
};

// Completely delete user and all their data (Master Admin only)
export const deleteUserCompletely = async (userId: string, deletedBy: string): Promise<void> => {
  try {
    // Get user data before deletion
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();

    // Remove birthday events if they exist
    if (userData?.name) {
      try {
        await removeBirthdayEventsByName(userData.name);
        console.log(`Birthday events removed for ${userData.name}`);
      } catch (birthdayError) {
        console.error('Error removing birthday events:', birthdayError);
        // Continue with deletion even if birthday removal fails
      }
    }

    // Delete all user-related data
    const batch = writeBatch(db);
    
    // Delete user document
    batch.delete(doc(db, 'users', userId));
    
    // Note: In a real implementation, you would also delete:
    // - User's questions from 'questions' collection
    // - User's answers from 'answers' collection  
    // - User's complaints from 'complaints' collection
    // - User's notifications from 'notifications' collection
    // - User's document statuses from 'userDocuments' collection
    // - Any other user-related data
    
    // For now, we'll just delete the user document
    await batch.commit();

    // Log the action in a separate collection for audit
    await logUserAction(userId, 'deleted' as any, deletedBy, `User completely deleted: ${userData.name} (${userData.email})`);
    
    console.log(`User ${userId} completely deleted by ${deletedBy}`);
  } catch (error) {
    console.error('Error deleting user completely:', error);
    throw error;
  }
};

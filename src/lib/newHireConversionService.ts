import { 
  collection, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { NewHire } from './newHireService';
import { userDocumentService, documentTemplateService } from './documentsService';
import { UserDocumentStatus } from '../types/documents';
import { User } from '../types';

export interface NewHireConversionResult {
  success: boolean;
  convertedFromNewHire: boolean;
  newHireData?: NewHire;
  transferredDocuments?: number;
  error?: string;
}

/**
 * Check if there's a new hire with the same email and convert them to active user
 * This function is called during user registration
 */
export const convertNewHireToActiveUser = async (
  userEmail: string,
  userId: string,
  userName: string
): Promise<NewHireConversionResult> => {
  try {
    console.log('🔄 Checking for new hire conversion:', { userEmail, userId, userName });

    // Find active new hire with matching email (assuming email format: firstName.lastName@domain)
    // or manually added with the same email
    const newHires = await getAllActiveNewHires();
    
    // Try to match by email or by name similarity
    const matchingNewHire = findMatchingNewHire(newHires, userEmail, userName);
    
    if (!matchingNewHire) {
      console.log('✅ No matching new hire found for:', userEmail);
      return { success: true, convertedFromNewHire: false };
    }

    console.log('🎯 Found matching new hire:', {
      newHireId: matchingNewHire.id,
      name: `${matchingNewHire.firstName} ${matchingNewHire.lastName}`,
      occupation: matchingNewHire.occupation
    });

    // Transfer new hire document data to the active user
    const transferredDocuments = await transferNewHireDocuments(matchingNewHire, userId, userName);

    // Update user profile with new hire information
    await updateUserWithNewHireData(userId, matchingNewHire);

    // Deactivate the new hire record (soft delete)
    await deactivateNewHire(matchingNewHire.id);

    console.log('✅ New hire conversion completed:', {
      newHireName: `${matchingNewHire.firstName} ${matchingNewHire.lastName}`,
      transferredDocuments,
      userId
    });

    return {
      success: true,
      convertedFromNewHire: true,
      newHireData: matchingNewHire,
      transferredDocuments
    };

  } catch (error) {
    console.error('❌ Error converting new hire to active user:', error);
    return {
      success: false,
      convertedFromNewHire: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get all active new hires
 */
async function getAllActiveNewHires(): Promise<NewHire[]> {
  const q = query(
    collection(db, 'newHires'),
    where('isActive', '==', true)
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
}

/**
 * Find a matching new hire based on email or name similarity
 */
function findMatchingNewHire(newHires: NewHire[], userEmail: string, userName: string): NewHire | null {
  const emailLower = userEmail.toLowerCase();
  const userNameLower = userName.toLowerCase();
  
  for (const newHire of newHires) {
    const newHireFullName = `${newHire.firstName} ${newHire.lastName}`.toLowerCase();
    const newHireFirstName = newHire.firstName.toLowerCase();
    const newHireLastName = newHire.lastName.toLowerCase();
    
    // Check if email starts with first name or contains both names
    const emailPrefix = emailLower.split('@')[0];
    
    // Match by email pattern (firstName.lastName@domain or firstNameLastName@domain)
    if (emailPrefix.includes(newHireFirstName) && emailPrefix.includes(newHireLastName)) {
      return newHire;
    }
    
    // Match by exact name
    if (userNameLower === newHireFullName) {
      return newHire;
    }
    
    // Match by first and last name components
    if (userNameLower.includes(newHireFirstName) && userNameLower.includes(newHireLastName)) {
      return newHire;
    }
  }
  
  return null;
}

/**
 * Transfer document statuses from new hire to active user
 */
async function transferNewHireDocuments(
  newHire: NewHire,
  userId: string,
  userName: string
): Promise<number> {
  try {
    console.log('📄 Transferring documents from new hire to user:', {
      newHireId: newHire.id,
      userId
    });

    // Get new hire document statuses using new hire verification service
    const { newHireVerificationService } = await import('./newHireVerificationService');
    const newHireDocuments = await newHireVerificationService.getNewHireDocuments(newHire.id);

    if (newHireDocuments.length === 0) {
      console.log('📄 No documents found for new hire');
      return 0;
    }

    console.log('📄 Found', newHireDocuments.length, 'new hire documents to transfer');

    // Initialize user documents for all templates first
    await userDocumentService.initializeForUser(userId, userName);

    const batch = writeBatch(db);
    let transferredCount = 0;

    for (const newHireDoc of newHireDocuments) {
      // Only transfer completed or started documents
      if (newHireDoc.status === 'completed' || newHireDoc.status === 'started' || newHireDoc.status === 'viewed') {
        // Find corresponding user document
        const userDocQuery = query(
          collection(db, 'userDocuments'),
          where('userId', '==', userId),
          where('documentTemplateId', '==', newHireDoc.documentTemplateId)
        );
        
        const userDocSnapshot = await getDocs(userDocQuery);
        
        if (!userDocSnapshot.empty) {
          const userDocId = userDocSnapshot.docs[0].id;
          const userDocRef = doc(db, 'userDocuments', userDocId);
          
          // Transfer the document data
          const updateData: Partial<UserDocumentStatus> = {
            status: newHireDoc.status,
            updatedAt: serverTimestamp(),
            convertedFromNewHire: true,
            originalNewHireId: newHire.id,
            originalNewHireName: `${newHire.firstName} ${newHire.lastName}`
          };

          // Transfer completion data if completed
          if (newHireDoc.status === 'completed') {
            updateData.completedAt = newHireDoc.completedAt || serverTimestamp();
            if (newHireDoc.completedDocumentUrl) {
              updateData.completedDocumentUrl = newHireDoc.completedDocumentUrl;
            }
            if (newHireDoc.completedDocumentName) {
              updateData.completedDocumentName = newHireDoc.completedDocumentName;
            }
            if (newHireDoc.auditLogUrl) {
              updateData.auditLogUrl = newHireDoc.auditLogUrl;
            }
          }

          // Transfer viewed/started timestamps
          if (newHireDoc.viewedAt) {
            updateData.viewedAt = newHireDoc.viewedAt;
          }
          if (newHireDoc.startedAt) {
            updateData.startedAt = newHireDoc.startedAt;
          }

          // Transfer DocuSeal data if available
          if (newHireDoc.docusealSubmissionId) {
            updateData.docusealSubmissionId = newHireDoc.docusealSubmissionId;
          }
          if (newHireDoc.webhookData) {
            updateData.webhookData = newHireDoc.webhookData;
          }

          batch.update(userDocRef, updateData);
          transferredCount++;
          
          console.log('📄 Queued document transfer:', {
            documentTemplateId: newHireDoc.documentTemplateId,
            status: newHireDoc.status,
            userDocId
          });
        }
      }
    }

    // Commit all document transfers
    if (transferredCount > 0) {
      await batch.commit();
      console.log('✅ Transferred', transferredCount, 'documents from new hire to user');
    }

    return transferredCount;

  } catch (error) {
    console.error('❌ Error transferring new hire documents:', error);
    throw error;
  }
}

/**
 * Update user profile with new hire data
 */
async function updateUserWithNewHireData(userId: string, newHire: NewHire): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      occupation: newHire.occupation,
      convertedFromNewHire: true,
      originalNewHireId: newHire.id,
      originalNewHireName: `${newHire.firstName} ${newHire.lastName}`,
      conversionDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Updated user profile with new hire data:', {
      userId,
      occupation: newHire.occupation,
      originalNewHireName: `${newHire.firstName} ${newHire.lastName}`
    });

  } catch (error) {
    console.error('❌ Error updating user with new hire data:', error);
    throw error;
  }
}

/**
 * Deactivate new hire record (soft delete)
 */
async function deactivateNewHire(newHireId: string): Promise<void> {
  try {
    const newHireRef = doc(db, 'newHires', newHireId);
    
    await updateDoc(newHireRef, {
      isActive: false,
      convertedToActiveUser: true,
      conversionDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Deactivated new hire record:', newHireId);

  } catch (error) {
    console.error('❌ Error deactivating new hire:', error);
    throw error;
  }
}

/**
 * Get conversion history for debugging/audit purposes
 */
export const getNewHireConversionHistory = async (): Promise<any[]> => {
  try {
    // Get users who were converted from new hires
    const usersQuery = query(
      collection(db, 'users'),
      where('convertedFromNewHire', '==', true)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    return usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        userName: data.name,
        userEmail: data.email,
        originalNewHireId: data.originalNewHireId,
        originalNewHireName: data.originalNewHireName,
        conversionDate: data.conversionDate?.toDate(),
        occupation: data.occupation
      };
    });

  } catch (error) {
    console.error('❌ Error getting conversion history:', error);
    throw error;
  }
};
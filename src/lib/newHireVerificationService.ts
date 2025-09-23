import { 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { NewHire } from './newHireService';
import { DocuSealWebhookPayload } from '../types/documents';
import { userDocumentService } from './documentsService';

export interface VerificationResult {
  success: boolean;
  newHire?: NewHire;
  issues: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface VerificationData {
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  zipCode?: string;
}

/**
 * Enhanced verification service for new hires using webhook data
 */
export const newHireVerificationService = {
  
  /**
   * Extract verification data from DocuSeal webhook payload
   */
  extractVerificationData(payload: DocuSealWebhookPayload): VerificationData {
    const data: VerificationData = {
      email: payload.data.email?.toLowerCase().trim(),
      fullName: payload.data.name?.trim()
    };

    // Extract form field values (if available)
    if (payload.data.values) {
      for (const field of payload.data.values) {
        const fieldName = field.field.toLowerCase();
        const value = Array.isArray(field.value) ? field.value[0] : field.value;
        
        if (fieldName.includes('first') && fieldName.includes('name')) {
          data.firstName = value?.trim();
        } else if (fieldName.includes('last') && fieldName.includes('name')) {
          data.lastName = value?.trim();
        } else if (fieldName.includes('zip') || fieldName.includes('postal')) {
          data.zipCode = value?.trim();
        }
      }
    }

    // If we have fullName but not firstName/lastName, try to split
    if (data.fullName && (!data.firstName || !data.lastName)) {
      const nameParts = data.fullName.split(' ').filter(part => part.length > 0);
      if (nameParts.length >= 2) {
        data.firstName = data.firstName || nameParts[0];
        data.lastName = data.lastName || nameParts[nameParts.length - 1];
      }
    }

    return data;
  },

  /**
   * Find and verify new hire identity using multiple criteria
   */
  async verifyNewHire(verificationData: VerificationData): Promise<VerificationResult> {
    const issues: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Get all active new hires
    const newHiresQuery = query(
      collection(db, 'newHires'),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(newHiresQuery);
    const newHires = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as NewHire[];

    if (newHires.length === 0) {
      return {
        success: false,
        issues: ['No active new hires found in system'],
        confidence: 'low'
      };
    }

    // Find potential matches
    const matches = newHires.filter(hire => {
      const firstNameMatch = this.normalizeString(hire.firstName) === 
                            this.normalizeString(verificationData.firstName || '');
      const lastNameMatch = this.normalizeString(hire.lastName) === 
                           this.normalizeString(verificationData.lastName || '');
      
      // For new hires, we primarily match on name since they don't have email accounts yet
      return firstNameMatch && lastNameMatch;
    });

    if (matches.length === 0) {
      // Try partial matching if exact match fails
      const partialMatches = newHires.filter(hire => {
        const lastNameMatch = this.normalizeString(hire.lastName) === 
                             this.normalizeString(verificationData.lastName || '');
        return lastNameMatch; // At minimum, last name must match
      });

      if (partialMatches.length === 0) {
        return {
          success: false,
          issues: [`No new hire found with last name "${verificationData.lastName}"`],
          confidence: 'low'
        };
      } else if (partialMatches.length === 1) {
        const hire = partialMatches[0];
        issues.push(`Partial match: Last name matches but first name "${verificationData.firstName}" doesn't exactly match "${hire.firstName}"`);
        confidence = 'medium';
        
        return {
          success: true,
          newHire: hire,
          issues,
          confidence
        };
      } else {
        return {
          success: false,
          issues: [`Multiple new hires found with last name "${verificationData.lastName}". Please verify manually.`],
          confidence: 'low'
        };
      }
    }

    if (matches.length === 1) {
      const hire = matches[0];
      confidence = 'high';

      // Additional verification with ZIP code if available
      if (verificationData.zipCode && hire.zipCode) {
        if (hire.zipCode !== verificationData.zipCode) {
          issues.push(`ZIP code mismatch: Expected ${hire.zipCode}, got ${verificationData.zipCode}`);
          confidence = 'medium';
        }
      }

      return {
        success: true,
        newHire: hire,
        issues,
        confidence
      };
    }

    // Multiple exact matches (rare but possible)
    return {
      success: false,
      issues: [`Multiple new hires found with name "${verificationData.firstName} ${verificationData.lastName}". Manual verification required.`],
      confidence: 'low'
    };
  },

  /**
   * Process webhook with enhanced new hire verification
   */
  async processNewHireWebhook(payload: DocuSealWebhookPayload): Promise<{
    success: boolean;
    verification: VerificationResult;
    userDocumentId?: string;
  }> {
    // Extract verification data
    const verificationData = this.extractVerificationData(payload);
    
    // Verify new hire identity
    const verification = await this.verifyNewHire(verificationData);
    
    if (!verification.success || !verification.newHire) {
      console.warn('New hire verification failed:', verification.issues);
      return { success: false, verification };
    }

    // Find or create user document for this new hire
    const newHire = verification.newHire;
    const templateId = payload.data.template.id.toString();
    
    try {
      // Look for existing user document
      const existingDocQuery = query(
        collection(db, 'userDocuments'),
        where('userId', '==', newHire.id),
        where('documentTemplateId', '==', templateId)
      );
      
      const existingDocSnapshot = await getDocs(existingDocQuery);
      let userDocumentId: string;
      
      if (existingDocSnapshot.empty) {
        // Create new user document
        userDocumentId = await userDocumentService.createUserDocument({
          userId: newHire.id,
          userName: `${newHire.firstName} ${newHire.lastName}`,
          documentTemplateId: templateId,
          status: 'not_started',
          docusealSubmissionId: payload.data.id.toString(),
          webhookData: payload,
          verificationData: verificationData,
          verificationResult: verification
        });
      } else {
        userDocumentId = existingDocSnapshot.docs[0].id;
      }

      // Update status based on webhook event
      let status: 'viewed' | 'started' | 'completed' | 'declined' = 'viewed';
      let updateFields: any = {
        docusealSubmissionId: payload.data.id.toString(),
        webhookData: payload,
        verificationData: verificationData,
        verificationResult: verification,
        lastVerifiedAt: serverTimestamp()
      };

      switch (payload.event_type) {
        case 'form.viewed':
          status = 'viewed';
          updateFields.viewedAt = new Date(payload.timestamp);
          break;
        case 'form.started':
          status = 'started';
          updateFields.startedAt = new Date(payload.timestamp);
          break;
        case 'submission.completed':
        case 'form.completed':
          status = 'completed';
          updateFields.completedAt = new Date(payload.timestamp);
          break;
        case 'form.declined':
          status = 'declined';
          updateFields.declinedAt = new Date(payload.timestamp);
          break;
      }

      updateFields.status = status;

      // Update the user document
      await updateDoc(doc(db, 'userDocuments', userDocumentId), updateFields);

      // Update new hire's last access time
      await updateDoc(doc(db, 'newHires', newHire.id), {
        lastAccessAt: serverTimestamp()
      });

      console.log(`New hire document updated successfully:`, {
        newHire: `${newHire.firstName} ${newHire.lastName}`,
        status,
        confidence: verification.confidence,
        issues: verification.issues
      });

      return {
        success: true,
        verification,
        userDocumentId
      };

    } catch (error) {
      console.error('Error processing new hire webhook:', error);
      return { success: false, verification };
    }
  },

  /**
   * Normalize strings for comparison (handle case, spaces, etc.)
   */
  normalizeString(str: string): string {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  },

  /**
   * Get verification statistics for admin dashboard
   */
  async getVerificationStats(): Promise<{
    totalVerifications: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    failed: number;
  }> {
    // This would query verification logs if we store them
    // For now, return placeholder
    return {
      totalVerifications: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      failed: 0
    };
  }
};

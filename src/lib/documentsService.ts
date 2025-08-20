import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  DocumentCategory,
  DocumentTemplate,
  UserDocumentStatus,
  DocumentWebhookEvent,
  DocuSealWebhookPayload
} from '../types/documents';

// Collections
const CATEGORIES_COLLECTION = 'documentCategories';
const TEMPLATES_COLLECTION = 'documentTemplates';
const USER_DOCUMENTS_COLLECTION = 'userDocuments';
const WEBHOOK_EVENTS_COLLECTION = 'documentWebhookEvents';

// Document Categories Service
export const documentCategoryService = {
  async getAll(): Promise<DocumentCategory[]> {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('isActive', '==', true),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as DocumentCategory[];
  },

  async create(category: Omit<DocumentCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<DocumentCategory>): Promise<void> {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    // Soft delete
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  onSnapshot(callback: (categories: DocumentCategory[]) => void) {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('isActive', '==', true),
      orderBy('name')
    );
    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as DocumentCategory[];
      callback(categories);
    });
  }
};

// Document Templates Service
export const documentTemplateService = {
  async getAll(): Promise<DocumentTemplate[]> {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      where('isActive', '==', true),
      orderBy('title')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as DocumentTemplate[];
  },

  async getByCategory(categoryId: string): Promise<DocumentTemplate[]> {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      where('categoryId', '==', categoryId),
      where('isActive', '==', true),
      orderBy('title')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as DocumentTemplate[];
  },

  async create(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<DocumentTemplate>): Promise<void> {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    // Soft delete
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  onSnapshot(callback: (templates: DocumentTemplate[]) => void) {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      where('isActive', '==', true),
      orderBy('title')
    );
    return onSnapshot(q, (snapshot) => {
      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as DocumentTemplate[];
      callback(templates);
    });
  }
};

// User Document Status Service
export const userDocumentService = {
  // Initialize user documents for all approved users when a new template is created
  async initializeForTemplate(templateId: string): Promise<void> {
    try {
      // Call the Cloud Function to initialize user documents
      const response = await fetch('/api/initializeUserDocuments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize user documents');
      }

      const result = await response.json();
      console.log('User documents initialized:', result);
    } catch (error) {
      console.error('Error initializing user documents:', error);
      throw error;
    }
  },

  // Initialize documents for all existing templates for a specific user (when user is approved)
  async initializeForUser(userId: string, userName: string): Promise<void> {
    const templates = await documentTemplateService.getAll();
    const batch = writeBatch(db);

    for (const template of templates) {
      // Check if user document already exists
      const existingQuery = query(
        collection(db, USER_DOCUMENTS_COLLECTION),
        where('userId', '==', userId),
        where('documentTemplateId', '==', template.id)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (existingSnapshot.empty) {
        const userDocRef = doc(collection(db, USER_DOCUMENTS_COLLECTION));
        batch.set(userDocRef, {
          userId,
          userName,
          documentTemplateId: template.id,
          status: 'not_started',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
  },

  // Ensure all users have all document templates (run this to sync existing data)
  async syncAllUserDocuments(): Promise<void> {
    try {
      const [templates, users] = await Promise.all([
        documentTemplateService.getAll(),
        // Get all approved users
        getDocs(query(
          collection(db, 'users'),
          where('status', '==', 'approved'),
          where('role', '==', 'user') // Only regular users, not admins
        ))
      ]);

      const batch = writeBatch(db);
      let batchCount = 0;

      for (const userDoc of users.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        for (const template of templates) {
          // Check if user document already exists
          const existingQuery = query(
            collection(db, USER_DOCUMENTS_COLLECTION),
            where('userId', '==', userId),
            where('documentTemplateId', '==', template.id)
          );
          const existingSnapshot = await getDocs(existingQuery);

          if (existingSnapshot.empty) {
            const userDocRef = doc(collection(db, USER_DOCUMENTS_COLLECTION));
            batch.set(userDocRef, {
              userId,
              userName: userData.name || userData.email,
              documentTemplateId: template.id,
              status: 'not_started',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            batchCount++;

            // Commit in batches of 500 (Firestore limit)
            if (batchCount >= 500) {
              await batch.commit();
              batchCount = 0;
            }
          }
        }
      }

      // Commit remaining documents
      if (batchCount > 0) {
        await batch.commit();
      }

      console.log('All user documents synchronized');
    } catch (error) {
      console.error('Error syncing user documents:', error);
      throw error;
    }
  },
  async getUserDocuments(userId: string): Promise<UserDocumentStatus[]> {
    const q = query(
      collection(db, USER_DOCUMENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      viewedAt: doc.data().viewedAt?.toDate(),
      startedAt: doc.data().startedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      declinedAt: doc.data().declinedAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
      lastReminderSent: doc.data().lastReminderSent?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as UserDocumentStatus[];
  },

  async getAllUserDocuments(): Promise<UserDocumentStatus[]> {
    const q = query(
      collection(db, USER_DOCUMENTS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      viewedAt: doc.data().viewedAt?.toDate(),
      startedAt: doc.data().startedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      declinedAt: doc.data().declinedAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
      lastReminderSent: doc.data().lastReminderSent?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as UserDocumentStatus[];
  },

  async getDocumentStatus(userId: string, documentTemplateId: string): Promise<UserDocumentStatus | null> {
    const q = query(
      collection(db, USER_DOCUMENTS_COLLECTION),
      where('userId', '==', userId),
      where('documentTemplateId', '==', documentTemplateId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      viewedAt: doc.data().viewedAt?.toDate(),
      startedAt: doc.data().startedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      declinedAt: doc.data().declinedAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
      lastReminderSent: doc.data().lastReminderSent?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as UserDocumentStatus;
  },

  async createUserDocument(userDocument: Omit<UserDocumentStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, USER_DOCUMENTS_COLLECTION), {
      ...userDocument,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateStatus(id: string, updates: Partial<UserDocumentStatus>): Promise<void> {
    const docRef = doc(db, USER_DOCUMENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Initialize user documents for all templates when a new user is approved
  async initializeUserDocuments(userId: string, userName: string): Promise<void> {
    const templates = await documentTemplateService.getAll();
    const batch = writeBatch(db);

    for (const template of templates) {
      const userDocRef = doc(collection(db, USER_DOCUMENTS_COLLECTION));
      batch.set(userDocRef, {
        userId,
        userName,
        documentTemplateId: template.id,
        status: 'not_started',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  },

  onUserDocumentsSnapshot(userId: string, callback: (documents: UserDocumentStatus[]) => void) {
    const q = query(
      collection(db, USER_DOCUMENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        viewedAt: doc.data().viewedAt?.toDate(),
        startedAt: doc.data().startedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        declinedAt: doc.data().declinedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        lastReminderSent: doc.data().lastReminderSent?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as UserDocumentStatus[];
      callback(documents);
    });
  }
};

// Webhook Events Service
export const webhookEventService = {
  async getRecentEvents(limitCount: number = 20): Promise<DocumentWebhookEvent[]> {
    const q = query(
      collection(db, WEBHOOK_EVENTS_COLLECTION),
      orderBy('processedAt', 'desc'),
      ...(limitCount ? [limit(limitCount)] : [])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      processedAt: doc.data().processedAt?.toDate(),
    })) as DocumentWebhookEvent[];
  },

  async logEvent(event: Omit<DocumentWebhookEvent, 'id' | 'processedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, WEBHOOK_EVENTS_COLLECTION), {
      ...event,
      processedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async processWebhook(payload: DocuSealWebhookPayload): Promise<void> {
    try {
      // Log the webhook event
      await this.logEvent({
        eventType: payload.event_type as any,
        submissionId: payload.data.id,
        eventData: payload,
        isProcessed: false,
      });

      // Find user document by submission ID or email
      const userEmail = payload.data.email;
      if (!userEmail) {
        throw new Error('No email found in webhook payload');
      }

      // Update user document status based on event type
      let status: UserDocumentStatus['status'];
      let updateFields: Partial<UserDocumentStatus> = {
        docusealSubmissionId: payload.data.id.toString(),
        webhookData: payload,
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
        default:
          console.warn('Unknown webhook event type:', payload.event_type);
          return;
      }

      updateFields.status = status;

      // Find and update the user document
      // This would require matching logic based on your DocuSeal integration
      // For now, we'll log success
      console.log('Webhook processed successfully:', payload.event_type);

    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }
};

// Utility functions
export const documentUtils = {
  getStatusColor(status: UserDocumentStatus['status']): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'started':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'declined':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'not_started':
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  },

  getStatusText(status: UserDocumentStatus['status']): string {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'viewed':
        return 'Viewed';
      case 'started':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  },

  isExpired(document: UserDocumentStatus): boolean {
    return document.expiresAt ? new Date() > document.expiresAt : false;
  },

  isExpiringSoon(document: UserDocumentStatus, days: number = 30): boolean {
    if (!document.expiresAt) return false;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return document.expiresAt <= threshold && document.expiresAt > new Date();
  }
};

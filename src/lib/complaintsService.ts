import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Complaint } from '../types';

export const complaintsService = {
  // Submit a new complaint (only for users)
  async submitComplaint(complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'status'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'complaints'), {
        ...complaintData,
        submittedAt: serverTimestamp(),
        status: 'submitted',
        dateOfIncidence: complaintData.dateOfIncidence ? Timestamp.fromDate(complaintData.dateOfIncidence) : null
      });
      return docRef.id;
    } catch (error) {
      console.error('Error submitting complaint:', error);
      throw new Error('Failed to submit complaint');
    }
  },

  // Get all complaints (admin only)
  async getAllComplaints(): Promise<Complaint[]> {
    try {
      const q = query(
        collection(db, 'complaints'),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          dateOfIncidence: data.dateOfIncidence?.toDate() || null,
          respondedAt: data.respondedAt?.toDate() || null,
          resolvedAt: data.resolvedAt?.toDate() || null
        } as Complaint;
      });
    } catch (error) {
      console.error('Error fetching all complaints:', error);
      throw new Error('Failed to fetch complaints');
    }
  },

  // Get complaints for a specific user (user can only see their own)
  async getUserComplaints(userId: string): Promise<Complaint[]> {
    try {
      const q = query(
        collection(db, 'complaints'),
        where('submittedBy', '==', userId),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          dateOfIncidence: data.dateOfIncidence?.toDate() || null,
          respondedAt: data.respondedAt?.toDate() || null,
          resolvedAt: data.resolvedAt?.toDate() || null
        } as Complaint;
      });
    } catch (error) {
      console.error('Error fetching user complaints:', error);
      throw new Error('Failed to fetch your complaints');
    }
  },

  // Update complaint status (admin only)
  async updateComplaintStatus(complaintId: string, status: Complaint['status']): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (status === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
      }
      
      await updateDoc(doc(db, 'complaints', complaintId), updateData);
    } catch (error) {
      console.error('Error updating complaint status:', error);
      throw new Error('Failed to update complaint status');
    }
  },

  // Add admin response to complaint (admin only)
  async respondToComplaint(
    complaintId: string, 
    response: string, 
    adminId: string, 
    adminName: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        adminResponse: response,
        respondedBy: adminId,
        respondedByName: adminName,
        respondedAt: serverTimestamp(),
        status: 'resolved' // Automatically mark as resolved when admin responds
      });
    } catch (error) {
      console.error('Error responding to complaint:', error);
      throw new Error('Failed to respond to complaint');
    }
  },

  // Assign complaint to admin (admin only)
  async assignComplaint(complaintId: string, adminId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        assignedTo: adminId,
        status: 'investigating'
      });
    } catch (error) {
      console.error('Error assigning complaint:', error);
      throw new Error('Failed to assign complaint');
    }
  },

  // Get single complaint by ID
  async getComplaint(complaintId: string): Promise<Complaint | null> {
    try {
      const docRef = doc(db, 'complaints', complaintId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          dateOfIncidence: data.dateOfIncidence?.toDate() || null,
          respondedAt: data.respondedAt?.toDate() || null,
          resolvedAt: data.resolvedAt?.toDate() || null
        } as Complaint;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching complaint:', error);
      throw new Error('Failed to fetch complaint');
    }
  },

  // Delete complaint (admin only - for inappropriate submissions)
  async deleteComplaint(complaintId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'complaints', complaintId));
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw new Error('Failed to delete complaint');
    }
  }
};

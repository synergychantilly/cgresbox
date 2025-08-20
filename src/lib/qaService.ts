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
  limit,
  serverTimestamp, 
  arrayUnion, 
  arrayRemove,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Question, Answer, EditRequest, QANotification } from '../types';

// Collections
const questionsRef = collection(db, 'questions');
const answersRef = collection(db, 'answers');
const editRequestsRef = collection(db, 'editRequests');
const notificationsRef = collection(db, 'notifications');

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return timestamp || new Date();
};

// Questions CRUD
export const createQuestion = async (questionData: {
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  authorName: string;
  isAnonymous: boolean;
}): Promise<string> => {
  try {
    const docRef = await addDoc(questionsRef, {
      ...questionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isAnswered: false,
      upvotes: 0,
      upvotedBy: [],
      commentsDisabled: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

export const getQuestions = async (): Promise<Question[]> => {
  try {
    const q = query(questionsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const questions: Question[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      
      try {
        // Get answers for this question (simplified query without orderBy to avoid index requirement)
        const answersQuery = query(
          answersRef, 
          where('questionId', '==', docSnap.id)
        );
        const answersSnapshot = await getDocs(answersQuery);
        
        const answers: Answer[] = answersSnapshot.docs.map(answerDoc => {
          const answerData = answerDoc.data();
          return {
            id: answerDoc.id,
            ...answerData,
            createdAt: convertTimestamp(answerData.createdAt),
            updatedAt: convertTimestamp(answerData.updatedAt)
          } as Answer;
        }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Sort in memory instead
        
        if (answers.length > 0) {
          console.log(`Found ${answers.length} answers for question ${docSnap.id}:`, answers);
        }
        
        questions.push({
          id: docSnap.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          answers
        } as Question);
      } catch (answerError) {
        // If we can't get answers, just add the question without answers
        console.warn('Could not fetch answers for question:', docSnap.id, answerError);
        questions.push({
          id: docSnap.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          answers: []
        } as Question);
      }
    }
    
    return questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

export const getQuestionsByCategory = async (category: string): Promise<Question[]> => {
  try {
    const q = query(
      questionsRef, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const questions: Question[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      
      try {
        // Get answers for this question (simplified query)
        const answersQuery = query(
          answersRef, 
          where('questionId', '==', docSnap.id)
        );
        const answersSnapshot = await getDocs(answersQuery);
        
        const answers: Answer[] = answersSnapshot.docs.map(answerDoc => {
          const answerData = answerDoc.data();
          return {
            id: answerDoc.id,
            ...answerData,
            createdAt: convertTimestamp(answerData.createdAt),
            updatedAt: convertTimestamp(answerData.updatedAt)
          } as Answer;
        }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        questions.push({
          id: docSnap.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          answers
        } as Question);
      } catch (answerError) {
        console.warn('Could not fetch answers for question:', docSnap.id, answerError);
        questions.push({
          id: docSnap.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          answers: []
        } as Question);
      }
    }
    
    return questions;
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    return [];
  }
};

export const upvoteQuestion = async (questionId: string, userId: string): Promise<void> => {
  try {
    const questionRef = doc(db, 'questions', questionId);
    const questionDoc = await getDoc(questionRef);
    
    if (!questionDoc.exists()) {
      throw new Error('Question not found');
    }
    
    const data = questionDoc.data();
    const upvotedBy = data.upvotedBy || [];
    
    if (upvotedBy.includes(userId)) {
      // Remove upvote
      await updateDoc(questionRef, {
        upvotes: increment(-1),
        upvotedBy: arrayRemove(userId)
      });
    } else {
      // Add upvote
      await updateDoc(questionRef, {
        upvotes: increment(1),
        upvotedBy: arrayUnion(userId)
      });
    }
  } catch (error) {
    console.error('Error upvoting question:', error);
    throw error;
  }
};

export const deleteQuestion = async (questionId: string, adminId: string): Promise<void> => {
  try {
    const questionRef = doc(db, 'questions', questionId);
    const questionDoc = await getDoc(questionRef);
    
    if (!questionDoc.exists()) {
      throw new Error('Question not found');
    }
    
    const questionData = questionDoc.data();
    
    // Delete all answers for this question
    const answersQuery = query(answersRef, where('questionId', '==', questionId));
    const answersSnapshot = await getDocs(answersQuery);
    
    const deletePromises = answersSnapshot.docs.map(answerDoc => 
      deleteDoc(doc(db, 'answers', answerDoc.id))
    );
    
    await Promise.all(deletePromises);
    
    // Delete the question
    await deleteDoc(questionRef);
    
    // Send notification to question author
    if (!questionData.isAnonymous) {
      await createNotification({
        userId: questionData.author,
        type: 'question_removed',
        title: 'Question Removed',
        message: `Your question "${questionData.title}" has been removed by an administrator.`,
        questionId: questionId
      });
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

export const toggleCommentsDisabled = async (questionId: string): Promise<void> => {
  try {
    const questionRef = doc(db, 'questions', questionId);
    const questionDoc = await getDoc(questionRef);
    
    if (!questionDoc.exists()) {
      throw new Error('Question not found');
    }
    
    const data = questionDoc.data();
    await updateDoc(questionRef, {
      commentsDisabled: !data.commentsDisabled
    });
  } catch (error) {
    console.error('Error toggling comments:', error);
    throw error;
  }
};

// Answers CRUD
export const createAnswer = async (answerData: {
  questionId: string;
  content: string;
  author: string;
  authorName: string;
  isAdminResponse: boolean;
}): Promise<string> => {
  try {
    const docRef = await addDoc(answersRef, {
      ...answerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      upvotes: 0,
      upvotedBy: [],
      isAccepted: false
    });
    
    try {
      // Update question's isAnswered status
      const questionRef = doc(db, 'questions', answerData.questionId);
      await updateDoc(questionRef, {
        isAnswered: true,
        updatedAt: serverTimestamp()
      });
      

    } catch (updateError) {
      console.error('Error updating question status (but answer was created):', updateError);
      // Don't throw here - the answer was created successfully
    }
    
    try {
      // Send notification to question author
      const questionRef = doc(db, 'questions', answerData.questionId);
      const questionDoc = await getDoc(questionRef);
      if (questionDoc.exists()) {
        const questionData = questionDoc.data();
        if (!questionData.isAnonymous && questionData.author !== answerData.author) {
          await createNotification({
            userId: questionData.author,
            type: 'answer_posted',
            title: 'New Answer',
            message: `${answerData.authorName} answered your question "${questionData.title}".`,
            questionId: answerData.questionId,
            answerId: docRef.id
          });

        }
      }
    } catch (notificationError) {
      console.error('Error creating notification (but answer was created):', notificationError);
      // Don't throw here - the answer was created successfully
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating answer:', error);
    throw error;
  }
};

export const upvoteAnswer = async (answerId: string, userId: string): Promise<void> => {
  try {
    const answerRef = doc(db, 'answers', answerId);
    const answerDoc = await getDoc(answerRef);
    
    if (!answerDoc.exists()) {
      throw new Error('Answer not found');
    }
    
    const data = answerDoc.data();
    const upvotedBy = data.upvotedBy || [];
    
    if (upvotedBy.includes(userId)) {
      // Remove upvote
      await updateDoc(answerRef, {
        upvotes: increment(-1),
        upvotedBy: arrayRemove(userId)
      });
    } else {
      // Add upvote
      await updateDoc(answerRef, {
        upvotes: increment(1),
        upvotedBy: arrayUnion(userId)
      });
    }
  } catch (error) {
    console.error('Error upvoting answer:', error);
    throw error;
  }
};

export const acceptAnswer = async (answerId: string): Promise<void> => {
  try {
    const answerRef = doc(db, 'answers', answerId);
    await updateDoc(answerRef, {
      isAccepted: true
    });
  } catch (error) {
    console.error('Error accepting answer:', error);
    throw error;
  }
};

export const deleteAnswer = async (answerId: string, userId: string, isAdmin: boolean): Promise<void> => {
  try {
    const answerRef = doc(db, 'answers', answerId);
    const answerDoc = await getDoc(answerRef);
    
    if (!answerDoc.exists()) {
      throw new Error('Answer not found');
    }
    
    const answerData = answerDoc.data();
    
    // Check permissions: admins can delete any answer, users can only delete their own
    if (!isAdmin && answerData.author !== userId) {
      throw new Error('Permission denied: You can only delete your own answers');
    }
    
    // Get the question to check if this was the only answer
    const questionRef = doc(db, 'questions', answerData.questionId);
    const questionDoc = await getDoc(questionRef);
    
    if (questionDoc.exists()) {
      // Check if there are other answers for this question
      const answersQuery = query(
        answersRef,
        where('questionId', '==', answerData.questionId)
      );
      const answersSnapshot = await getDocs(answersQuery);
      
      // If this is the only answer, mark question as unanswered
      if (answersSnapshot.docs.length === 1) {
        await updateDoc(questionRef, {
          isAnswered: false,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    // Delete the answer
    await deleteDoc(answerRef);
    
    console.log('Answer deleted successfully:', answerId);
  } catch (error) {
    console.error('Error deleting answer:', error);
    throw error;
  }
};

// Edit Requests
export const createEditRequest = async (editRequestData: {
  questionId: string;
  requestedBy: string;
  requestedByName: string;
  originalContent: string;
  newContent: string;
  reason: string;
}): Promise<string> => {
  try {
    const docRef = await addDoc(editRequestsRef, {
      ...editRequestData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating edit request:', error);
    throw error;
  }
};

export const getEditRequests = async (): Promise<EditRequest[]> => {
  try {
    const q = query(editRequestsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      reviewedAt: convertTimestamp(doc.data().reviewedAt)
    } as EditRequest));
  } catch (error) {
    console.error('Error fetching edit requests:', error);
    // Return empty array instead of throwing
    return [];
  }
};

export const getUserEditRequests = async (userId: string): Promise<EditRequest[]> => {
  try {
    const q = query(
      editRequestsRef, 
      where('requestedBy', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        reviewedAt: convertTimestamp(data.reviewedAt)
      } as EditRequest;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort in memory instead
    
    return requests;
  } catch (error) {
    console.error('Error fetching user edit requests:', error);
    // Return empty array instead of throwing
    return [];
  }
};

export const approveEditRequest = async (
  requestId: string, 
  adminId: string, 
  adminName: string
): Promise<void> => {
  try {
    const requestRef = doc(db, 'editRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Edit request not found');
    }
    
    const requestData = requestDoc.data();
    
    // Update the question with new content
    const questionRef = doc(db, 'questions', requestData.questionId);
    await updateDoc(questionRef, {
      content: requestData.newContent,
      updatedAt: serverTimestamp()
    });
    
    // Update edit request status
    await updateDoc(requestRef, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp()
    });
    
    // Send notification to requester
    await createNotification({
      userId: requestData.requestedBy,
      type: 'edit_approved',
      title: 'Edit Request Approved',
      message: `Your edit request has been approved by ${adminName}.`,
      questionId: requestData.questionId
    });
  } catch (error) {
    console.error('Error approving edit request:', error);
    throw error;
  }
};

export const rejectEditRequest = async (
  requestId: string, 
  adminId: string, 
  adminName: string
): Promise<void> => {
  try {
    const requestRef = doc(db, 'editRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Edit request not found');
    }
    
    const requestData = requestDoc.data();
    
    // Update edit request status
    await updateDoc(requestRef, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp()
    });
    
    // Send notification to requester
    await createNotification({
      userId: requestData.requestedBy,
      type: 'edit_rejected',
      title: 'Edit Request Rejected',
      message: `Your edit request has been rejected by ${adminName}.`,
      questionId: requestData.questionId
    });
  } catch (error) {
    console.error('Error rejecting edit request:', error);
    throw error;
  }
};

// Notifications
export const createNotification = async (notificationData: {
  userId: string;
  type: 'question_removed' | 'edit_approved' | 'edit_rejected' | 'answer_posted';
  title: string;
  message: string;
  questionId?: string;
  answerId?: string;
}): Promise<string> => {
  try {
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      isRead: false,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId: string): Promise<QANotification[]> => {
  try {
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    } as QANotification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};
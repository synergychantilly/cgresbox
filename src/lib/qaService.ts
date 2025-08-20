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
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Question, 
  Answer, 
  CreateQuestionData, 
  UpdateQuestionData, 
  CreateAnswerData, 
  UpdateAnswerData,
  VoteAnswerData 
} from '../types/qa';
import { getUserById, canUserAskQuestion, incrementUserQuestionCount } from './userService';

const QUESTIONS_COLLECTION = 'questions';
const ANSWERS_COLLECTION = 'answers';

// Helper function to validate description length (max 150 words)
const validateDescriptionWordCount = (description: string): boolean => {
  const words = description.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length <= 150;
};

// Create a new question
export const createQuestion = async (
  questionData: CreateQuestionData, 
  authorId: string
): Promise<string> => {
  try {
    // Check if user can ask a question today
    const canAsk = await canUserAskQuestion(authorId);
    if (!canAsk) {
      throw new Error('You have reached the daily question limit (1 question per day)');
    }

    // Validate description word count
    if (!validateDescriptionWordCount(questionData.description)) {
      throw new Error('Description must not exceed 150 words');
    }

    // Get user info for author name
    const user = await getUserById(authorId);
    if (!user) {
      throw new Error('User not found');
    }

    const docData = {
      ...questionData,
      author: authorId,
      authorName: user.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      answerCount: 0,
      isResolved: false
    };

    const docRef = await addDoc(collection(db, QUESTIONS_COLLECTION), docData);

    // Increment user's question count
    await incrementUserQuestionCount(authorId);

    console.log('Question created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

// Update an existing question
export const updateQuestion = async (
  questionId: string, 
  questionData: UpdateQuestionData,
  userId: string
): Promise<void> => {
  try {
    // Validate description word count if description is being updated
    if (questionData.description && !validateDescriptionWordCount(questionData.description)) {
      throw new Error('Description must not exceed 150 words');
    }

    // Check if user is the author or admin
    const question = await getQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only allow author or admin to update
    if (question.author !== userId && user.role !== 'admin') {
      throw new Error('Unauthorized to update this question');
    }

    const updateFields = {
      ...questionData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, QUESTIONS_COLLECTION, questionId), updateFields);
    console.log('Question updated:', questionId);
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

// Delete a question and all its answers
export const deleteQuestion = async (questionId: string, userId: string): Promise<void> => {
  try {
    // Check permissions
    const question = await getQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only allow admin to delete questions
    if (user.role !== 'admin') {
      throw new Error('Only administrators can delete questions');
    }

    // Delete all answers first
    const answers = await getAnswersByQuestionId(questionId);
    for (const answer of answers) {
      await deleteDoc(doc(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION, answer.id));
    }

    // Delete the question
    await deleteDoc(doc(db, QUESTIONS_COLLECTION, questionId));
    console.log('Question and all answers deleted:', questionId);
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// Get all questions
export const getQuestions = async (): Promise<Question[]> => {
  try {
    const q = query(
      collection(db, QUESTIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data.question,
        description: data.description,
        author: data.author,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        answerCount: data.answerCount || 0,
        isResolved: data.isResolved || false,
        tags: data.tags || [],
        category: data.category
      } as Question;
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Get questions by category
export const getQuestionsByCategory = async (category: string): Promise<Question[]> => {
  try {
    const q = query(
      collection(db, QUESTIONS_COLLECTION),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data.question,
        description: data.description,
        author: data.author,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        answerCount: data.answerCount || 0,
        isResolved: data.isResolved || false,
        tags: data.tags || [],
        category: data.category
      } as Question;
    });
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    throw error;
  }
};

// Get unresolved questions
export const getUnresolvedQuestions = async (): Promise<Question[]> => {
  try {
    const q = query(
      collection(db, QUESTIONS_COLLECTION),
      where('isResolved', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data.question,
        description: data.description,
        author: data.author,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        answerCount: data.answerCount || 0,
        isResolved: data.isResolved || false,
        tags: data.tags || [],
        category: data.category
      } as Question;
    });
  } catch (error) {
    console.error('Error fetching unresolved questions:', error);
    throw error;
  }
};

// Get a specific question by ID
export const getQuestionById = async (questionId: string): Promise<Question | null> => {
  try {
    const questionDoc = await getDoc(doc(db, QUESTIONS_COLLECTION, questionId));
    if (questionDoc.exists()) {
      const data = questionDoc.data();
      return {
        id: questionDoc.id,
        question: data.question,
        description: data.description,
        author: data.author,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        answerCount: data.answerCount || 0,
        isResolved: data.isResolved || false,
        tags: data.tags || [],
        category: data.category
      } as Question;
    }
    return null;
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
};

// Create a new answer
export const createAnswer = async (
  questionId: string,
  answerData: CreateAnswerData, 
  authorId: string
): Promise<string> => {
  try {
    // Get user info for author name
    const user = await getUserById(authorId);
    if (!user) {
      throw new Error('User not found');
    }

    const docData = {
      ...answerData,
      questionId,
      author: authorId,
      authorName: user.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isAccepted: false,
      votes: 0,
      voters: []
    };

    const docRef = await addDoc(
      collection(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION), 
      docData
    );

    // Increment answer count on question
    await updateDoc(doc(db, QUESTIONS_COLLECTION, questionId), {
      answerCount: increment(1),
      updatedAt: serverTimestamp()
    });

    console.log('Answer created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating answer:', error);
    throw error;
  }
};

// Update an existing answer
export const updateAnswer = async (
  questionId: string,
  answerId: string,
  answerData: UpdateAnswerData,
  userId: string
): Promise<void> => {
  try {
    // Check if user is the author or admin
    const answer = await getAnswerById(questionId, answerId);
    if (!answer) {
      throw new Error('Answer not found');
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only allow author or admin to update
    if (answer.author !== userId && user.role !== 'admin') {
      throw new Error('Unauthorized to update this answer');
    }

    const updateFields = {
      ...answerData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(
      doc(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION, answerId), 
      updateFields
    );
    console.log('Answer updated:', answerId);
  } catch (error) {
    console.error('Error updating answer:', error);
    throw error;
  }
};

// Delete an answer
export const deleteAnswer = async (
  questionId: string,
  answerId: string,
  userId: string
): Promise<void> => {
  try {
    // Check permissions
    const answer = await getAnswerById(questionId, answerId);
    if (!answer) {
      throw new Error('Answer not found');
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only allow admin to delete answers
    if (user.role !== 'admin') {
      throw new Error('Only administrators can delete answers');
    }

    await deleteDoc(doc(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION, answerId));

    // Decrement answer count on question
    await updateDoc(doc(db, QUESTIONS_COLLECTION, questionId), {
      answerCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    console.log('Answer deleted:', answerId);
  } catch (error) {
    console.error('Error deleting answer:', error);
    throw error;
  }
};

// Get answers for a specific question
export const getAnswersByQuestionId = async (questionId: string): Promise<Answer[]> => {
  try {
    const q = query(
      collection(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION),
      orderBy('votes', 'desc'),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        questionId,
        answer: data.answer,
        author: data.author,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isAccepted: data.isAccepted || false,
        votes: data.votes || 0,
        voters: data.voters || []
      } as Answer;
    });
  } catch (error) {
    console.error('Error fetching answers:', error);
    throw error;
  }
};

// Get a specific answer by ID
export const getAnswerById = async (questionId: string, answerId: string): Promise<Answer | null> => {
  try {
    const answerDoc = await getDoc(doc(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION, answerId));
    if (answerDoc.exists()) {
      const data = answerDoc.data();
      return {
        id: answerDoc.id,
        questionId,
        answer: data.answer,
        author: data.author,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isAccepted: data.isAccepted || false,
        votes: data.votes || 0,
        voters: data.voters || []
      } as Answer;
    }
    return null;
  } catch (error) {
    console.error('Error fetching answer:', error);
    throw error;
  }
};

// Vote on an answer (up/down/remove)
export const voteAnswer = async (
  questionId: string,
  voteData: VoteAnswerData,
  userId: string
): Promise<void> => {
  try {
    const { answerId, vote } = voteData;
    const answerRef = doc(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION, answerId);
    
    const answer = await getAnswerById(questionId, answerId);
    if (!answer) {
      throw new Error('Answer not found');
    }

    const hasVoted = answer.voters.includes(userId);

    if (vote === 'remove') {
      if (hasVoted) {
        await updateDoc(answerRef, {
          votes: increment(-1),
          voters: arrayRemove(userId)
        });
      }
    } else {
      if (hasVoted) {
        // User already voted, can't vote again
        throw new Error('You have already voted on this answer');
      }

      const voteChange = vote === 'up' ? 1 : -1;
      await updateDoc(answerRef, {
        votes: increment(voteChange),
        voters: arrayUnion(userId)
      });
    }

    console.log('Vote recorded for answer:', answerId);
  } catch (error) {
    console.error('Error voting on answer:', error);
    throw error;
  }
};

// Mark an answer as accepted (only question author or admin)
export const acceptAnswer = async (
  questionId: string,
  answerId: string,
  userId: string
): Promise<void> => {
  try {
    const question = await getQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only question author or admin can accept answers
    if (question.author !== userId && user.role !== 'admin') {
      throw new Error('Only the question author or admin can accept answers');
    }

    // Unmark any previously accepted answers
    const answers = await getAnswersByQuestionId(questionId);
    for (const answer of answers) {
      if (answer.isAccepted) {
        await updateDoc(
          doc(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION, answer.id),
          { isAccepted: false }
        );
      }
    }

    // Mark the selected answer as accepted
    await updateDoc(
      doc(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION, answerId),
      { isAccepted: true }
    );

    // Mark question as resolved
    await updateDoc(doc(db, QUESTIONS_COLLECTION, questionId), {
      isResolved: true,
      updatedAt: serverTimestamp()
    });

    console.log('Answer accepted:', answerId);
  } catch (error) {
    console.error('Error accepting answer:', error);
    throw error;
  }
};

// Subscribe to questions for real-time updates
export const subscribeToQuestions = (callback: (questions: Question[]) => void) => {
  const q = query(
    collection(db, QUESTIONS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const questions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data.question,
        description: data.description,
        author: data.author,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        answerCount: data.answerCount || 0,
        isResolved: data.isResolved || false,
        tags: data.tags || [],
        category: data.category
      } as Question;
    });
    callback(questions);
  });
};

// Subscribe to answers for a specific question
export const subscribeToAnswers = (
  questionId: string, 
  callback: (answers: Answer[]) => void
) => {
  const q = query(
    collection(db, QUESTIONS_COLLECTION, questionId, ANSWERS_COLLECTION),
    orderBy('votes', 'desc'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const answers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        questionId,
        answer: data.answer,
        author: data.author,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isAccepted: data.isAccepted || false,
        votes: data.votes || 0,
        voters: data.voters || []
      } as Answer;
    });
    callback(answers);
  });
};

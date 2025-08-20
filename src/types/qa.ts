export interface Question {
  id: string;
  question: string;
  description: string; // Rich content HTML, max 150 words
  author: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  answerCount: number;
  isResolved: boolean;
  tags?: string[];
  category?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  answer: string;
  author: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  isAccepted: boolean;
  votes: number;
  voters: string[]; // User IDs who voted
}

export interface CreateQuestionData {
  question: string;
  description: string;
  tags?: string[];
  category?: string;
}

export interface UpdateQuestionData {
  question?: string;
  description?: string;
  tags?: string[];
  category?: string;
  isResolved?: boolean;
}

export interface CreateAnswerData {
  answer: string;
}

export interface UpdateAnswerData {
  answer?: string;
}

export interface VoteAnswerData {
  answerId: string;
  vote: 'up' | 'down' | 'remove';
}

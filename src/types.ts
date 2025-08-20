// Main types file - legacy types for existing components
// Note: New features use individual type files in src/types/ directory

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'payday' | 'birthday' | 'meeting' | 'important' | 'event';
  allDay?: boolean;
  reminder?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'urgent' | 'warning' | 'info' | 'celebration';
  author: string;
  publishedAt: Date;
  isRead: boolean;
  attachments?: string[];
}

export interface Document {
  id: string;
  title: string;
  description: string;
  type: 'policy' | 'form' | 'training' | 'manual';
  category: string;
  fileUrl?: string;
  isRequired: boolean;
  completionDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  question: string;
  description: string;
  author: string;
  authorName: string;
  category: string;
  tags: string[];
  createdAt: Date;
  isResolved: boolean;
  answerCount: number;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  type: 'workplace' | 'safety' | 'harassment' | 'discrimination' | 'other';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'reviewing' | 'investigating' | 'resolved' | 'closed';
  submittedBy: string;
  submittedAt: Date;
  isAnonymous: boolean;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Document' | 'Image' | 'Resource' | 'URL' | 'document' | 'video' | 'link' | 'form' | 'policy';
  category: string;
  tags: string[];
  url?: string;
  fileUrl?: string;
  downloadCount: number;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'disabled';
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  questionsAskedToday?: number;
  lastQuestionDate?: Date;
}

// Re-export new type system
export * from './types';

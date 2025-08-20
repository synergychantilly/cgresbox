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

// Legacy Document interface - replaced by new document system in types/documents.ts
// Keeping for backward compatibility with existing components
export interface Document {
  id: string;
  title: string;
  description: string;
  type: 'certification' | 'training' | 'medical' | 'timesheet' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  fileName?: string;
  fileSize: number;
  fileUrl?: string;
  expiryDate?: Date;
  uploadedAt: Date;
  requiredFor?: string[];
}

export interface Question {
  id: string;
  title: string;
  content: string;
  author: string;
  authorName: string;
  category: 'General' | 'Caregiver' | 'Office' | 'Safety' | 'Clients' | 'Training' | 'Other';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isAnswered: boolean;
  upvotes: number;
  upvotedBy: string[];
  answers: Answer[];
  commentsDisabled: boolean;
  isAnonymous: boolean;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  author: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number;
  upvotedBy: string[];
  isAccepted: boolean;
  isAdminResponse: boolean;
}

export interface EditRequest {
  id: string;
  questionId: string;
  requestedBy: string;
  requestedByName: string;
  originalContent: string;
  newContent: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface QANotification {
  id: string;
  userId: string;
  type: 'question_removed' | 'edit_approved' | 'edit_rejected' | 'answer_posted';
  title: string;
  message: string;
  questionId?: string;
  answerId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Complaint {
  id: string;
  topic: string; // Topic of Complaint
  description: string;
  isAboutSomeone: boolean; // Is this about someone? (Yes or No)
  whoIsThisAbout?: string; // Who is this referring to? (only if isAboutSomeone is true)
  dateOfIncidence?: Date; // Date of Incidence (can be null for unknown)
  dateUnknown: boolean; // Whether the date of incidence is unknown
  category: 'workplace' | 'safety' | 'harassment' | 'discrimination' | 'schedule' | 'equipment' | 'other';
  status: 'submitted' | 'reviewing' | 'investigating' | 'resolved' | 'closed';
  submittedBy: string; // User ID who submitted
  submittedByName?: string; // Name of user (for admin view, null if anonymous)
  submittedAt: Date;
  isAnonymous: boolean;
  adminResponse?: string; // Admin's response to the complaint
  respondedBy?: string; // Admin user ID who responded
  respondedByName?: string; // Admin name who responded
  respondedAt?: Date; // When admin responded
  assignedTo?: string; // Admin assigned to handle the complaint
  resolvedAt?: Date;
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
  birthday?: Date;
  isMasterAdmin?: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  questionsAskedToday?: number;
  lastQuestionDate?: Date;
}

// Re-export new type system
export * from './types';

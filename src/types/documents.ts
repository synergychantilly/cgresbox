export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  color?: string; // For UI differentiation
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin who created it
  isActive: boolean;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  docusealLink: string; // DocuSeal form/template URL
  docusealTemplateId: string; // DocuSeal template ID (e.g., "548893")
  categoryId: string;
  isRequired: boolean;
  reminderDays?: number; // Days before deadline to send reminder
  expiryDays?: number; // How many days document is valid
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin who created it
  isActive: boolean;
  tags: string[];
}

export interface UserDocumentStatus {
  id: string;
  userId: string;
  userName: string;
  documentTemplateId: string;
  status: 'not_started' | 'viewed' | 'started' | 'completed' | 'declined' | 'expired';
  docusealSubmissionId?: string; // From DocuSeal webhook
  completedDocumentUrl?: string; // URL to the completed/signed document
  completedDocumentName?: string; // Name of the completed document
  auditLogUrl?: string; // URL to the audit log
  submissionUrl?: string; // URL to the DocuSeal submission page
  viewedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  declinedAt?: Date;
  expiresAt?: Date;
  lastReminderSent?: Date;
  webhookData?: any; // Store raw webhook data for debugging
  // Manual completion fields
  isManuallyCompleted?: boolean; // Flag to indicate manual completion by admin
  manuallyCompletedBy?: string; // Admin user ID who manually completed it
  manuallyCompletedAt?: Date; // When it was manually completed
  // New hire verification fields
  verificationData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    zipCode?: string;
  };
  verificationResult?: {
    success: boolean;
    confidence: 'high' | 'medium' | 'low';
    issues: string[];
  };
  lastVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentWebhookEvent {
  id: string;
  eventType: 'form.viewed' | 'form.started' | 'submission.created' | 'submission.completed' | 'form.completed' | 'form.declined';
  submissionId: string;
  userId?: string; // May need to extract from webhook data
  documentTemplateId?: string;
  eventData: any; // Raw webhook payload
  processedAt: Date;
  isProcessed: boolean;
  errorMessage?: string;
}

// Updated webhook payload interface based on actual DocuSeal webhook
export interface DocuSealWebhookPayload {
  event_type: string;
  timestamp: string;
  data: {
    id: number; // submission ID
    email: string;
    phone?: string;
    name?: string;
    ua?: string;
    ip?: string;
    sent_at?: string;
    opened_at?: string;
    declined_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    external_id?: string;
    metadata?: any;
    status: 'pending' | 'completed' | 'declined';
    application_key?: string;
    decline_reason?: string;
    preferences?: any;
    values?: Array<{
      field: string;
      value: string | string[];
    }>;
    role?: string;
    documents?: Array<{
      name: string;
      url: string;
    }>;
    template: {
      id: number; // This is the key for matching!
      name: string;
      external_id?: string;
      created_at: string;
      updated_at: string;
      folder_name?: string;
    };
    audit_log_url?: string;
    submission_url?: string;
    submission?: {
      id: number;
      created_at: string;
      audit_log_url?: string;
      combined_document_url?: string;
      status: string;
      url: string;
    };
  };
}

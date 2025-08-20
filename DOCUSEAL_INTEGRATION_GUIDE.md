# DocuSeal Integration Guide

This guide explains how to set up and use the DocuSeal integration with the CareConnect document management system.

## Overview

The integration provides:
- Document categories for organizing templates
- DocuSeal template management with links
- Real-time tracking of user document progress via webhooks
- Admin dashboard for document creation and user tracking
- User-facing interface to access and complete documents

## System Architecture

```
DocuSeal → Webhooks → Firebase Cloud Functions → Firestore → React UI
```

### Webhook Events Tracked:
- `form.viewed` - User opens the document
- `form.started` - User begins filling the form
- `submission.created` - Form submission is created
- `submission.completed` - User completes and signs the document
- `form.completed` - Document is fully completed
- `form.declined` - User declines to sign

## Setup Instructions

### 1. Deploy Firebase Cloud Functions

```bash
# Install dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions
```

This will create the following endpoints:
- `docusealWebhook` - Main webhook handler  
- `cleanupWebhookEvents` - Cleanup old webhook logs
- `initializeUserDocuments` - Initialize documents for new templates

**Your Current Webhook URLs:**
- Main: `https://docusealwebhook-owuk5ohvjq-uc.a.run.app`
- Cleanup: `https://cleanupwebhookevents-owuk5ohvjq-uc.a.run.app` 
- Initialize: `https://initializeuserdocuments-owuk5ohvjq-uc.a.run.app`

### 2. Configure DocuSeal Webhooks

1. Log in to your DocuSeal account
2. Navigate to Console → Webhooks  
3. Create a new webhook with:
   - **URL**: `https://docusealwebhook-owuk5ohvjq-uc.a.run.app`
   - **Events**: Select all relevant events:
     - form.viewed
     - form.started
     - submission.created
     - submission.completed
     - form.completed
     - form.declined
   - **Secret**: (Optional but recommended for security)

### 3. Set Environment Variables (Optional)

If using webhook signature verification:

```bash
firebase functions:secrets:set DOCUSEAL_WEBHOOK_SECRET
```

### 4. Create Document Categories

1. Access the admin panel as an admin user
2. Go to "Document Management" → "Categories" tab
3. Create categories like:
   - Training Certificates
   - Safety Forms
   - Employment Documents
   - Medical Records

### 5. Create Document Templates

1. In DocuSeal, create your document templates
2. **Note the Template ID** - found in webhook payloads under `template.id` (e.g., `548893`)
3. In CareConnect admin panel, go to "Document Management" → "Document Templates" tab
4. Add templates with:
   - Title and description
   - DocuSeal link (copy from DocuSeal)
   - **DocuSeal Template ID** (CRITICAL - e.g., `548893`)
   - Category selection
   - Required status
   - Reminder and expiry settings
   - Tags for organization

**⚠️ IMPORTANT:** The DocuSeal Template ID is essential for accurate tracking. This ID links the webhook events to the correct document template in your system.

## Usage Workflow

### Admin Workflow

1. **Create Categories**: Organize documents into logical groups
2. **Create Templates**: Link DocuSeal forms to CareConnect categories
3. **Monitor Progress**: Track user completion via the tracking dashboard
4. **User Management**: View compact progress reports for all users

### User Workflow

1. **View Assigned Documents**: Users see all assigned documents with progress
2. **Access Documents**: Click to open DocuSeal forms in new tab
3. **Progress Tracking**: Real-time updates on document status
4. **Completion Tracking**: Clear indicators of completed vs pending documents

### Enhanced Automatic Tracking

The system now accurately tracks user progress using email matching and DocuSeal Template IDs:

1. **Email Matching**: Uses `data.email` from webhook payload to find the user
2. **Template ID Matching**: Uses `data.template.id` to find the correct document template  
3. **Timestamp Accuracy**: Uses actual timestamps from DocuSeal (`opened_at`, `completed_at`, etc.)
4. **Complete Timeline**: Tracks viewed → started → completed with precise timestamps

**Example Webhook Processing:**
```json
{
  "event_type": "form.completed", 
  "data": {
    "email": "user@example.com",
    "template": {
      "id": 548893,
      "name": "Direct Deposit Form"
    },
    "opened_at": "2025-08-20T15:39:45.880Z",
    "completed_at": "2025-08-20T15:49:13.811Z"
  }
}
```

→ System finds user by email, matches template by ID 548893, updates status to "completed" with accurate timestamps.

## Database Structure

### Collections Created:

- `documentCategories` - Document categories with colors and descriptions
- `documentTemplates` - DocuSeal templates with metadata
- `userDocuments` - Individual user progress on each document
- `documentWebhookEvents` - Webhook event logs for debugging

### User Document Status Flow:

```
not_started → viewed → started → completed
                              ↘ declined
```

## API Endpoints

### Webhook Handler
- **URL**: `/docusealWebhook`
- **Method**: POST
- **Purpose**: Receive DocuSeal webhook events
- **Security**: Optional signature verification

### Cleanup Function
- **URL**: `/cleanupWebhookEvents`
- **Method**: GET
- **Purpose**: Clean up old webhook events (30+ days)

### User Document Initialization
- **URL**: `/initializeUserDocuments`
- **Method**: POST
- **Body**: `{ "templateId": "template_id" }`
- **Purpose**: Create user documents for all approved users when adding new templates

## Monitoring and Debugging

### Webhook Event Logs
All webhook events are logged in the `documentWebhookEvents` collection with:
- Event type and timestamp
- Processing status
- User and document mapping
- Raw webhook payload for debugging

### Cloud Function Logs
View logs in Firebase Console → Functions for troubleshooting webhook processing.

### User Progress Tracking
The admin dashboard provides real-time visibility into:
- Document completion rates
- Individual user progress
- Overdue and expiring documents
- Compact view for high-volume tracking

## Security Considerations

1. **Webhook Security**: Use signature verification with a secret key
2. **Firestore Rules**: Updated rules restrict access to document collections
3. **User Mapping**: Users are matched by email address from DocuSeal
4. **Admin Access**: Only admins can create/manage templates and categories

## Troubleshooting

### Common Issues:

1. **User not found**: Ensure user email in DocuSeal matches registered email
2. **Template not found**: Verify DocuSeal link matches the template URL pattern
3. **Webhook not firing**: Check DocuSeal webhook configuration and URL
4. **Status not updating**: Check Cloud Function logs for errors

### Debug Commands:

```javascript
// In browser console (admin only)
// Check webhook events
firebase.firestore().collection('documentWebhookEvents').orderBy('processedAt', 'desc').limit(10).get()

// Check user documents
firebase.firestore().collection('userDocuments').where('userId', '==', 'USER_ID').get()
```

## Best Practices

1. **Template Naming**: Use clear, descriptive names for both DocuSeal and CareConnect templates
2. **Category Organization**: Create logical categories that match your workflow
3. **Required Documents**: Mark critical documents as required for clear priority
4. **Expiry Management**: Set appropriate expiry days based on document type
5. **Regular Monitoring**: Use the admin dashboard to track completion rates
6. **Webhook Cleanup**: Run cleanup function monthly to manage webhook event storage

## Integration Benefits

- **No API Polling**: Real-time updates via webhooks eliminate need for API calls
- **Centralized Tracking**: Single dashboard for all document progress
- **User Experience**: Clear progress indicators and easy document access
- **Admin Efficiency**: Bulk tracking and compact views for large user volumes
- **Compliance**: Automatic expiry tracking and reminder systems

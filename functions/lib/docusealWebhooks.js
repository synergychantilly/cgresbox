"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUserDocuments = exports.cleanupWebhookEvents = exports.docusealWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
// Initialize Firebase Admin
const app = (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)(app);
exports.docusealWebhook = (0, https_1.onRequest)({
    cors: true
}, async (request, response) => {
    try {
        // Verify request method
        if (request.method !== 'POST') {
            response.status(405).send('Method Not Allowed');
            return;
        }
        // Verify webhook signature (optional but recommended)
        // For now, we'll skip signature verification
        // You can add this later by setting up the DOCUSEAL_WEBHOOK_SECRET
        const signature = request.headers['x-docuseal-signature'];
        if (signature) {
            firebase_functions_1.logger.info('Webhook signature received but verification is disabled for now');
        }
        const payload = request.body;
        firebase_functions_1.logger.info('Received DocuSeal webhook', {
            eventType: payload.event_type,
            submissionId: payload.data.id,
            timestamp: payload.timestamp
        });
        // Log the webhook event
        await db.collection('documentWebhookEvents').add({
            eventType: payload.event_type,
            submissionId: payload.data.id,
            eventData: payload,
            isProcessed: false,
            processedAt: new Date()
        });
        // Process the webhook based on event type
        await processWebhookEvent(payload);
        response.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error processing DocuSeal webhook', error);
        // Log the error but still return 200 to prevent webhook retries
        // for unrecoverable errors
        response.status(200).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
});
async function processWebhookEvent(payload) {
    try {
        // Extract email directly from payload data
        const userEmail = payload.data.email;
        if (!userEmail) {
            firebase_functions_1.logger.warn('No email found in webhook payload', { submissionId: payload.data.id });
            return;
        }
        // Find user by email (case insensitive)
        const usersQuery = await db.collection('users')
            .where('email', '==', userEmail.toLowerCase())
            .limit(1)
            .get();
        let userDoc;
        if (usersQuery.empty) {
            // Try case-sensitive search as fallback
            const usersFallbackQuery = await db.collection('users')
                .where('email', '==', userEmail)
                .limit(1)
                .get();
            if (usersFallbackQuery.empty) {
                firebase_functions_1.logger.warn('User not found for email', {
                    email: userEmail,
                    submissionId: payload.data.id,
                    templateId: payload.data.template.id
                });
                return;
            }
            userDoc = usersFallbackQuery.docs[0];
        }
        else {
            userDoc = usersQuery.docs[0];
        }
        const userId = userDoc.id;
        const userData = userDoc.data();
        // Find document template by DocuSeal template ID (primary method)
        const docusealTemplateId = payload.data.template.id.toString();
        const templatesQuery = await db.collection('documentTemplates')
            .where('docusealTemplateId', '==', docusealTemplateId)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        let documentTemplateId = null;
        if (!templatesQuery.empty) {
            documentTemplateId = templatesQuery.docs[0].id;
            firebase_functions_1.logger.info('Found template by DocuSeal template ID', {
                docusealTemplateId,
                documentTemplateId,
                templateName: payload.data.template.name
            });
        }
        else {
            // Fallback: try to find by template name
            const nameQuery = await db.collection('documentTemplates')
                .where('title', '==', payload.data.template.name)
                .where('isActive', '==', true)
                .limit(1)
                .get();
            if (!nameQuery.empty) {
                documentTemplateId = nameQuery.docs[0].id;
                firebase_functions_1.logger.info('Found template by name (fallback)', {
                    templateName: payload.data.template.name,
                    documentTemplateId
                });
            }
        }
        if (!documentTemplateId) {
            firebase_functions_1.logger.warn('Document template not found', {
                docusealTemplateId,
                templateName: payload.data.template.name,
                submissionId: payload.data.id,
                userEmail
            });
            return;
        }
        // Find or create user document status
        const userDocQuery = await db.collection('userDocuments')
            .where('userId', '==', userId)
            .where('documentTemplateId', '==', documentTemplateId)
            .limit(1)
            .get();
        let userDocRef;
        if (userDocQuery.empty) {
            // Create new user document status
            userDocRef = db.collection('userDocuments').doc();
            await userDocRef.set({
                userId,
                userName: userData.name || userEmail,
                documentTemplateId,
                status: 'not_started',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        else {
            userDocRef = userDocQuery.docs[0].ref;
        }
        // Update status based on webhook event
        const updateData = {
            docusealSubmissionId: payload.data.id.toString(),
            webhookData: payload,
            updatedAt: new Date()
        };
        const eventTimestamp = new Date(payload.timestamp);
        // Determine status and timestamps based on event type and payload data
        switch (payload.event_type) {
            case 'form.viewed':
                updateData.status = 'viewed';
                updateData.viewedAt = payload.data.opened_at ? new Date(payload.data.opened_at) : eventTimestamp;
                firebase_functions_1.logger.info('Processing form.viewed event', { submissionId: payload.data.id, email: payload.data.email });
                break;
            case 'form.started':
                updateData.status = 'started';
                updateData.startedAt = eventTimestamp;
                // Also set viewedAt if not already set
                if (payload.data.opened_at && !updateData.viewedAt) {
                    updateData.viewedAt = new Date(payload.data.opened_at);
                }
                firebase_functions_1.logger.info('Processing form.started event', { submissionId: payload.data.id, email: payload.data.email });
                break;
            case 'submission.created':
                updateData.status = 'started';
                updateData.startedAt = new Date(payload.data.created_at);
                firebase_functions_1.logger.info('Processing submission.created event', { submissionId: payload.data.id, email: payload.data.email });
                break;
            case 'form.opened':
                // Some DocuSeal setups might send this instead of form.viewed
                updateData.status = 'viewed';
                updateData.viewedAt = eventTimestamp;
                firebase_functions_1.logger.info('Processing form.opened event', { submissionId: payload.data.id, email: payload.data.email });
                break;
            case 'submission.completed':
            case 'form.completed':
                updateData.status = 'completed';
                updateData.completedAt = payload.data.completed_at ?
                    new Date(payload.data.completed_at) : eventTimestamp;
                // Capture document URLs from webhook
                if (payload.data.documents && payload.data.documents.length > 0) {
                    updateData.completedDocumentUrl = payload.data.documents[0].url;
                    updateData.completedDocumentName = payload.data.documents[0].name;
                }
                // Capture additional URLs
                if (payload.data.audit_log_url) {
                    updateData.auditLogUrl = payload.data.audit_log_url;
                }
                if (payload.data.submission_url) {
                    updateData.submissionUrl = payload.data.submission_url;
                }
                // Set previous timestamps if available
                if (payload.data.opened_at) {
                    updateData.viewedAt = new Date(payload.data.opened_at);
                }
                if (payload.data.created_at && !updateData.startedAt) {
                    updateData.startedAt = new Date(payload.data.created_at);
                }
                // Calculate expiry date based on template settings
                const templateDoc = await db.collection('documentTemplates').doc(documentTemplateId).get();
                if (templateDoc.exists) {
                    const templateData = templateDoc.data();
                    if (templateData === null || templateData === void 0 ? void 0 : templateData.expiryDays) {
                        const completionDate = updateData.completedAt || eventTimestamp;
                        const expiryDate = new Date(completionDate);
                        expiryDate.setDate(expiryDate.getDate() + templateData.expiryDays);
                        updateData.expiresAt = expiryDate;
                    }
                }
                firebase_functions_1.logger.info('Processing completion event', {
                    submissionId: payload.data.id,
                    email: payload.data.email,
                    eventType: payload.event_type,
                    documentUrl: updateData.completedDocumentUrl,
                    documentName: updateData.completedDocumentName
                });
                break;
            case 'form.declined':
                updateData.status = 'declined';
                updateData.declinedAt = payload.data.declined_at ?
                    new Date(payload.data.declined_at) : eventTimestamp;
                // Set previous timestamps if available
                if (payload.data.opened_at) {
                    updateData.viewedAt = new Date(payload.data.opened_at);
                }
                break;
            default:
                firebase_functions_1.logger.warn('Unknown webhook event type', {
                    eventType: payload.event_type,
                    submissionId: payload.data.id
                });
                return;
        }
        // Update the user document status
        await userDocRef.update(updateData);
        // Mark webhook event as processed
        const webhookEventQuery = await db.collection('documentWebhookEvents')
            .where('submissionId', '==', payload.data.id)
            .where('eventType', '==', payload.event_type)
            .orderBy('processedAt', 'desc')
            .limit(1)
            .get();
        if (!webhookEventQuery.empty) {
            await webhookEventQuery.docs[0].ref.update({
                isProcessed: true,
                userId,
                documentTemplateId
            });
        }
        firebase_functions_1.logger.info('Webhook processed successfully', {
            userId,
            documentTemplateId,
            status: updateData.status,
            eventType: payload.event_type
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error processing webhook event', {
            error,
            eventType: payload.event_type,
            submissionId: payload.data.id
        });
        throw error;
    }
}
// Optional: Function to clean up old webhook events
exports.cleanupWebhookEvents = (0, https_1.onRequest)(async (request, response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const oldEventsQuery = await db.collection('documentWebhookEvents')
            .where('processedAt', '<', thirtyDaysAgo)
            .limit(500)
            .get();
        const batch = db.batch();
        oldEventsQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        response.json({
            success: true,
            deletedCount: oldEventsQuery.size,
            message: 'Old webhook events cleaned up'
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error cleaning up webhook events', error);
        response.status(500).json({
            success: false,
            error: 'Cleanup failed'
        });
    }
});
// Helper function to initialize user documents for new templates
exports.initializeUserDocuments = (0, https_1.onRequest)(async (request, response) => {
    try {
        if (request.method !== 'POST') {
            response.status(405).send('Method Not Allowed');
            return;
        }
        const { templateId } = request.body;
        if (!templateId) {
            response.status(400).json({ error: 'Template ID is required' });
            return;
        }
        // Get all approved users
        const usersQuery = await db.collection('users')
            .where('status', '==', 'approved')
            .get();
        const batch = db.batch();
        let count = 0;
        for (const userDoc of usersQuery.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            // Check if user document already exists
            const existingDoc = await db.collection('userDocuments')
                .where('userId', '==', userId)
                .where('documentTemplateId', '==', templateId)
                .limit(1)
                .get();
            if (existingDoc.empty) {
                const userDocRef = db.collection('userDocuments').doc();
                batch.set(userDocRef, {
                    userId,
                    userName: userData.name || userData.email,
                    documentTemplateId: templateId,
                    status: 'not_started',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                count++;
            }
            // Commit in batches of 500 (Firestore limit)
            if (count % 500 === 0) {
                await batch.commit();
            }
        }
        // Commit remaining documents
        if (count % 500 !== 0) {
            await batch.commit();
        }
        response.json({
            success: true,
            message: `Initialized documents for ${count} users`,
            count
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error initializing user documents', error);
        response.status(500).json({
            success: false,
            error: 'Initialization failed'
        });
    }
});
//# sourceMappingURL=docusealWebhooks.js.map
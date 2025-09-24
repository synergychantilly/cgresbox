import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { emailService } from './emailService';
import { registrationService, NewHireConversionData } from './registrationService';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

interface ConversionRequest {
  newHireId: string;
  email: string;
  createdBy: string;
}

interface ConversionResult {
  success: boolean;
  message: string;
  registrationToken?: string;
  registrationLink?: string;
  error?: string;
}

/**
 * Cloud Function to convert a new hire to a user with email invitation
 */
export const convertNewHireToUser = functions.https.onCall(
  async (data: ConversionRequest, context): Promise<ConversionResult> => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to perform this action.'
      );
    }

    // Verify admin role
    try {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(context.auth.uid)
        .get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'User record not found.'
        );
      }

      const userData = userDoc.data();
      if (!userData || userData.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only administrators can convert new hires to users.'
        );
      }
    } catch (error) {
      console.error('❌ Error verifying admin permissions:', error);
      throw new functions.https.HttpsError(
        'permission-denied',
        'Failed to verify admin permissions.'
      );
    }

    const { newHireId, email, createdBy } = data;

    // Validate required fields
    if (!newHireId || !email || !createdBy) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: newHireId, email, or createdBy.'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email format.'
      );
    }

    try {
      // Get new hire data
      const newHireDoc = await admin.firestore()
        .collection('newHires')
        .doc(newHireId)
        .get();

      if (!newHireDoc.exists) {
        return {
          success: false,
          message: 'New hire not found.',
          error: 'NEW_HIRE_NOT_FOUND'
        };
      }

      const newHireData = newHireDoc.data();
      if (!newHireData) {
        return {
          success: false,
          message: 'New hire data is invalid.',
          error: 'INVALID_DATA'
        };
      }

      // Check if new hire is active
      if (!newHireData.isActive) {
        return {
          success: false,
          message: 'New hire is not active.',
          error: 'INACTIVE_NEW_HIRE'
        };
      }

      // Check if email is already in use
      const existingUserQuery = await admin.firestore()
        .collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!existingUserQuery.empty) {
        return {
          success: false,
          message: 'Email address is already in use by another user.',
          error: 'EMAIL_ALREADY_EXISTS'
        };
      }

      // Check if this new hire has already been converted
      const existingTokenQuery = await admin.firestore()
        .collection('registrationTokens')
        .where('newHireId', '==', newHireId)
        .where('isUsed', '==', false)
        .limit(1)
        .get();

      if (!existingTokenQuery.empty) {
        const existingToken = existingTokenQuery.docs[0].data();
        const registrationLink = registrationService.generateRegistrationLink(existingToken.token);
        
        return {
          success: false,
          message: 'New hire already has a pending registration token.',
          error: 'TOKEN_ALREADY_EXISTS',
          registrationToken: existingToken.token,
          registrationLink
        };
      }

      // Create conversion data
      const conversionData: NewHireConversionData = {
        newHireId,
        firstName: newHireData.firstName,
        lastName: newHireData.lastName,
        occupation: newHireData.occupation,
        email: email.toLowerCase(),
        createdBy
      };

      // Create registration token
      const registrationToken = await registrationService.createRegistrationToken(conversionData);
      
      // Generate registration link
      const registrationLink = registrationService.generateRegistrationLink(registrationToken.token);

      // Send email invitation
      const emailData = {
        firstName: newHireData.firstName,
        lastName: newHireData.lastName,
        occupation: newHireData.occupation,
        registrationToken: registrationToken.token,
        registrationLink
      };

      const emailSent = await emailService.sendRegistrationEmail(email, emailData);

      if (!emailSent) {
        // If email failed, we should probably clean up the token
        await registrationService.revokeToken(registrationToken.id);
        
        return {
          success: false,
          message: 'Failed to send registration email. Please try again.',
          error: 'EMAIL_SEND_FAILED'
        };
      }

      // Log the conversion attempt
      await admin.firestore().collection('conversionLogs').add({
        newHireId,
        email,
        createdBy,
        registrationTokenId: registrationToken.id,
        status: 'email_sent',
        createdAt: admin.firestore.Timestamp.now(),
        firstName: newHireData.firstName,
        lastName: newHireData.lastName,
        occupation: newHireData.occupation
      });

      console.log(`✅ New hire conversion initiated for ${newHireData.firstName} ${newHireData.lastName}`);

      return {
        success: true,
        message: `Registration email sent successfully to ${email}`,
        registrationToken: registrationToken.token,
        registrationLink
      };

    } catch (error) {
      console.error('❌ Error converting new hire to user:', error);
      
      return {
        success: false,
        message: 'An unexpected error occurred during conversion.',
        error: 'UNKNOWN_ERROR'
      };
    }
  }
);

/**
 * Cloud Function to get conversion status and logs
 */
export const getConversionLogs = functions.https.onCall(
  async (data: { limit?: number }, context) => {
    // Check authentication and admin role
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated.'
      );
    }

    try {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(context.auth.uid)
        .get();

      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only administrators can view conversion logs.'
        );
      }

      const limit = data.limit || 50;
      const snapshot = await admin.firestore()
        .collection('conversionLogs')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, logs };
    } catch (error) {
      console.error('❌ Error fetching conversion logs:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch conversion logs.');
    }
  }
);

/**
 * Scheduled function to cleanup expired registration tokens
 */
export const cleanupExpiredTokens = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const cleanedCount = await registrationService.cleanupExpiredTokens();
      console.log(`🧹 Cleaned up ${cleanedCount} expired registration tokens`);
      return { success: true, cleanedCount };
    } catch (error) {
      console.error('❌ Error during token cleanup:', error);
      return { success: false, error: error };
    }
  });

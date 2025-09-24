import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

export interface RegistrationToken {
  id: string;
  token: string;
  newHireId: string;
  firstName: string;
  lastName: string;
  occupation: string;
  email: string;
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  isUsed: boolean;
  usedAt?: admin.firestore.Timestamp;
  convertedUserId?: string;
  createdBy: string; // Admin who created the token
}

export interface NewHireConversionData {
  newHireId: string;
  firstName: string;
  lastName: string;
  occupation: string;
  email: string;
  createdBy: string;
}

class RegistrationService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Generate a secure registration token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a registration token for a new hire
   */
  async createRegistrationToken(data: NewHireConversionData): Promise<RegistrationToken> {
    const token = this.generateToken();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    );

    const registrationToken: Omit<RegistrationToken, 'id'> = {
      token,
      newHireId: data.newHireId,
      firstName: data.firstName,
      lastName: data.lastName,
      occupation: data.occupation,
      email: data.email,
      createdAt: now,
      expiresAt,
      isUsed: false,
      createdBy: data.createdBy,
    };

    try {
      const docRef = await this.db.collection('registrationTokens').add(registrationToken);
      
      console.log(`🎫 Registration token created for ${data.firstName} ${data.lastName}`);
      
      return {
        id: docRef.id,
        ...registrationToken,
      };
    } catch (error) {
      console.error('❌ Error creating registration token:', error);
      throw new Error('Failed to create registration token');
    }
  }

  /**
   * Validate and retrieve a registration token
   */
  async validateToken(token: string): Promise<RegistrationToken | null> {
    try {
      const snapshot = await this.db
        .collection('registrationTokens')
        .where('token', '==', token)
        .where('isUsed', '==', false)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log('❌ Token not found or already used');
        return null;
      }

      const doc = snapshot.docs[0];
      const tokenData = doc.data() as Omit<RegistrationToken, 'id'>;
      const registrationToken: RegistrationToken = {
        id: doc.id,
        ...tokenData,
      };

      // Check if token has expired
      const now = new Date();
      const expiresAt = registrationToken.expiresAt.toDate();
      
      if (now > expiresAt) {
        console.log('❌ Token has expired');
        return null;
      }

      return registrationToken;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      return null;
    }
  }

  /**
   * Mark a registration token as used
   */
  async markTokenAsUsed(tokenId: string, convertedUserId: string): Promise<void> {
    try {
      await this.db.collection('registrationTokens').doc(tokenId).update({
        isUsed: true,
        usedAt: admin.firestore.Timestamp.now(),
        convertedUserId,
      });

      console.log(`✅ Token ${tokenId} marked as used`);
    } catch (error) {
      console.error('❌ Error marking token as used:', error);
      throw new Error('Failed to mark token as used');
    }
  }

  /**
   * Generate registration link for the frontend
   */
  generateRegistrationLink(token: string, baseUrl?: string): string {
    const base = baseUrl || 'https://caregiver-resource-box.web.app';
    return `${base}/register?token=${token}`;
  }

  /**
   * Cleanup expired tokens (can be called periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = admin.firestore.Timestamp.now();
      const snapshot = await this.db
        .collection('registrationTokens')
        .where('expiresAt', '<', now)
        .where('isUsed', '==', false)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`🧹 Cleaned up ${snapshot.docs.length} expired tokens`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('❌ Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Get all registration tokens for admin view
   */
  async getRegistrationTokens(limit: number = 50): Promise<RegistrationToken[]> {
    try {
      const snapshot = await this.db
        .collection('registrationTokens')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RegistrationToken[];
    } catch (error) {
      console.error('❌ Error fetching registration tokens:', error);
      return [];
    }
  }

  /**
   * Revoke a registration token
   */
  async revokeToken(tokenId: string): Promise<void> {
    try {
      await this.db.collection('registrationTokens').doc(tokenId).update({
        isUsed: true,
        usedAt: admin.firestore.Timestamp.now(),
        convertedUserId: 'REVOKED',
      });

      console.log(`🚫 Token ${tokenId} revoked`);
    } catch (error) {
      console.error('❌ Error revoking token:', error);
      throw new Error('Failed to revoke token');
    }
  }
}

export const registrationService = new RegistrationService();


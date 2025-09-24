"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationService = void 0;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
class RegistrationService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Generate a secure registration token
     */
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Create a registration token for a new hire
     */
    async createRegistrationToken(data) {
        const token = this.generateToken();
        const now = admin.firestore.Timestamp.now();
        const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        );
        const registrationToken = {
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
            return Object.assign({ id: docRef.id }, registrationToken);
        }
        catch (error) {
            console.error('❌ Error creating registration token:', error);
            throw new Error('Failed to create registration token');
        }
    }
    /**
     * Validate and retrieve a registration token
     */
    async validateToken(token) {
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
            const tokenData = doc.data();
            const registrationToken = Object.assign({ id: doc.id }, tokenData);
            // Check if token has expired
            const now = new Date();
            const expiresAt = registrationToken.expiresAt.toDate();
            if (now > expiresAt) {
                console.log('❌ Token has expired');
                return null;
            }
            return registrationToken;
        }
        catch (error) {
            console.error('❌ Error validating token:', error);
            return null;
        }
    }
    /**
     * Mark a registration token as used
     */
    async markTokenAsUsed(tokenId, convertedUserId) {
        try {
            await this.db.collection('registrationTokens').doc(tokenId).update({
                isUsed: true,
                usedAt: admin.firestore.Timestamp.now(),
                convertedUserId,
            });
            console.log(`✅ Token ${tokenId} marked as used`);
        }
        catch (error) {
            console.error('❌ Error marking token as used:', error);
            throw new Error('Failed to mark token as used');
        }
    }
    /**
     * Generate registration link for the frontend
     */
    generateRegistrationLink(token, baseUrl) {
        const base = baseUrl || 'https://caregiver-resource-box.web.app';
        return `${base}/register?token=${token}`;
    }
    /**
     * Cleanup expired tokens (can be called periodically)
     */
    async cleanupExpiredTokens() {
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
        }
        catch (error) {
            console.error('❌ Error cleaning up expired tokens:', error);
            return 0;
        }
    }
    /**
     * Get all registration tokens for admin view
     */
    async getRegistrationTokens(limit = 50) {
        try {
            const snapshot = await this.db
                .collection('registrationTokens')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            console.error('❌ Error fetching registration tokens:', error);
            return [];
        }
    }
    /**
     * Revoke a registration token
     */
    async revokeToken(tokenId) {
        try {
            await this.db.collection('registrationTokens').doc(tokenId).update({
                isUsed: true,
                usedAt: admin.firestore.Timestamp.now(),
                convertedUserId: 'REVOKED',
            });
            console.log(`🚫 Token ${tokenId} revoked`);
        }
        catch (error) {
            console.error('❌ Error revoking token:', error);
            throw new Error('Failed to revoke token');
        }
    }
}
exports.registrationService = new RegistrationService();
//# sourceMappingURL=registrationService.js.map
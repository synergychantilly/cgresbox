# 📧 Email Pipeline Setup Guide

## Overview

This guide walks you through setting up the email pipeline to convert new hires into real users using your `hashimosman@synergyhomecare.com` Gmail account.

## 🔧 Prerequisites

1. **Gmail Account**: `hashimosman@synergyhomecare.com` (already connected to Firebase)
2. **Google Cloud Console**: Access to your Firebase project's Google Cloud Console
3. **Firebase CLI**: Installed and authenticated
4. **Admin Access**: To the Firebase project

## 📋 Setup Steps

### Step 1: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project: `caregiver-resource-box`
3. Navigate to **APIs & Services** > **Library**
4. Search for "Gmail API" and enable it

### Step 2: Create OAuth2 Credentials

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
3. If prompted, configure the OAuth consent screen:
   - Application type: **Web application**
   - Application name: **CareConnect Email Service**
   - Authorized domains: Add your domain(s)
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: **CareConnect Email Pipeline**
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`

### Step 3: Get Refresh Token

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click the gear icon (⚙️) in the top right
3. Check **"Use your own OAuth credentials"**
4. Enter your Client ID and Client Secret from Step 2
5. In the left panel, scroll down to **Gmail API v1**
6. Select: `https://www.googleapis.com/auth/gmail.send`
7. Click **Authorize APIs**
8. Sign in with `hashimosman@synergyhomecare.com`
9. Click **Exchange authorization code for tokens**
10. Copy the **Refresh Token** (save this securely)

### Step 4: Configure Firebase Functions

Run these commands to set up the configuration:

\`\`\`bash
# Navigate to your project directory
cd "C:\Users\Hashim\Documents\Coding Projects\CareConnect"

# Set Gmail configuration for Firebase Functions
firebase functions:config:set gmail.client_id="YOUR_CLIENT_ID"
firebase functions:config:set gmail.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set gmail.refresh_token="YOUR_REFRESH_TOKEN"
\`\`\`

Replace the placeholders with your actual values:
- `YOUR_CLIENT_ID`: From Step 2
- `YOUR_CLIENT_SECRET`: From Step 2  
- `YOUR_REFRESH_TOKEN`: From Step 3

### Step 5: Deploy Firebase Functions

\`\`\`bash
# Build and deploy the functions
cd functions
npm run build
firebase deploy --only functions
\`\`\`

### Step 6: Test the Setup

1. **Build and start your frontend**:
   \`\`\`bash
   cd ..
   npm run dev
   \`\`\`

2. **Test the conversion process**:
   - Login as admin (`hashimosman@synergyhomecare.com`)
   - Go to **User Management** > **New Hires** tab
   - Create a test new hire
   - Click **Convert to User** button
   - Enter an email address
   - Click **Convert & Send Email**

## 🔧 Configuration Values

Here's what you need to collect and configure:

| Setting | Description | Example |
|---------|-------------|---------|
| `gmail.client_id` | OAuth 2.0 Client ID | `123456789.apps.googleusercontent.com` |
| `gmail.client_secret` | OAuth 2.0 Client Secret | `GOC...secret` |
| `gmail.refresh_token` | OAuth 2.0 Refresh Token | `1//04...token` |

## 📧 Email Features

### What Gets Sent
- **Professional welcome email** with SynergyHomeCare branding
- **Secure registration link** (valid for 7 days)
- **Clear instructions** for account setup
- **Registration token** for backup access

### Email Template
The email includes:
- Personalized greeting with new hire's name and role
- Welcome message and next steps
- Prominent registration button
- Information about account approval process
- Professional SynergyHomeCare branding

## 🚀 Usage Instructions

### For Administrators

1. **Convert New Hire to User**:
   - Navigate to User Management → New Hires
   - Find the new hire you want to convert
   - Click **Convert to User** (blue button)
   - Enter their email address
   - Preview the email content (optional)
   - Click **Convert & Send Email**

2. **Monitor Conversions**:
   - The system tracks all conversion attempts
   - Registration tokens are automatically managed
   - Failed emails can be resent

### For New Hires

1. **Receive Email**: Gets professional welcome email with registration link
2. **Click Registration Link**: Secure 7-day valid link
3. **Complete Registration**: Set up password and verify email
4. **Wait for Approval**: Admin reviews and approves the account
5. **Access Full System**: Once approved, full CareConnect access

## 🔒 Security Features

- **Secure OAuth 2.0**: Gmail API authentication
- **Encrypted tokens**: Registration tokens are cryptographically secure
- **Time-limited links**: 7-day expiration on registration links
- **Audit trail**: All conversion attempts are logged
- **Admin-only access**: Only administrators can convert new hires

## 🛠️ Troubleshooting

### Common Issues

1. **"Email service initialization failed"**
   - Check Gmail API is enabled
   - Verify OAuth credentials are correct
   - Ensure refresh token is valid

2. **"Failed to send email"**
   - Check Gmail API quotas
   - Verify the sender email (`hashimosman@synergyhomecare.com`) has permission
   - Check Firebase Functions logs

3. **"Permission denied"**
   - Verify user has admin role
   - Check Firestore security rules

### Firebase Functions Logs

\`\`\`bash
# View functions logs
firebase functions:log
\`\`\`

### Testing Configuration

\`\`\`bash
# View current configuration
firebase functions:config:get
\`\`\`

## 📊 Monitoring

### Key Metrics to Monitor
- Email delivery success rate
- Registration completion rate
- Token expiration and cleanup
- User conversion pipeline timing

### Logs to Check
- Firebase Functions logs for email sending
- Firestore for conversion tracking
- Gmail API quota usage

## 🔄 Maintenance

### Regular Tasks
- Monitor Gmail API quotas
- Clean up expired tokens (automated)
- Review conversion logs
- Update email templates as needed

### Token Refresh
The system automatically handles token refresh, but monitor for:
- OAuth token expiration
- Gmail API permission changes
- Account access issues

## 💡 Next Steps

Once the email pipeline is working:
1. **Test with real new hire data**
2. **Monitor email delivery rates**
3. **Customize email templates** if needed
4. **Set up monitoring alerts** for failed conversions
5. **Consider adding email templates** for different scenarios

## 🆘 Support

If you encounter issues:
1. Check Firebase Functions logs
2. Verify Gmail API quotas
3. Test OAuth credentials
4. Contact Google Cloud Support if needed

The system is designed to be robust and handle failures gracefully, with comprehensive logging and error handling throughout the pipeline.


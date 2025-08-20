# CareConnect User System Implementation Guide

## Overview

This document describes the comprehensive user authentication and authorization system implemented for CareConnect. The system supports role-based access control with two main roles: **Admin** and **User**.

## System Architecture

### User Roles

#### Admin Role
- **Permissions:**
  - Create/Edit/Remove Updates, Calendar Events, Resources
  - Update Document Lists (with DocuSeal integration planned)
  - Respond to Complaints Submitted
  - Respond to Q&A submissions
  - Halt/Disable Users
  - Enable/Approve new users
  - Access User Management dashboard

#### User Role
- **Permissions:**
  - View all available information (when approved)
  - Submit Complaints
  - Submit 1 Question per day
  - Complete documentation via direct links
  - Create account (pending approval)

### User Status System

Users have three possible statuses:
1. **Pending** - Newly registered, awaiting admin approval
2. **Approved** - Approved by admin, can access the platform
3. **Disabled** - Blocked by admin, cannot access the platform

## Implementation Details

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)

The `AuthProvider` manages global authentication state and provides:
- User login/logout functionality
- Registration with automatic pending status
- Real-time user data synchronization
- Admin user initialization
- Question limit tracking (1 per day for users)

### 2. Security Rules (`firestore.rules`)

Comprehensive Firestore security rules implement:
- Role-based access control
- User status verification
- Data isolation (users can only see their own data unless admin)
- Audit trail protection
- Collection-specific permissions

### 3. User Interface Components

#### Authentication Flow
- **Login Component** - Modern, responsive login form
- **Register Component** - Registration with success confirmation
- **AuthWrapper** - Handles authentication flow routing
- **PendingApproval** - Shown to users awaiting approval

#### Admin Interface
- **UserManagement Component** - Complete admin dashboard for user management
- Real-time pending user notifications
- User approval/rejection workflow
- User search and filtering
- Status management (enable/disable users)

### 4. User Management Service (`src/lib/userService.ts`)

Provides functions for:
- User approval workflow
- User status management
- Real-time user subscriptions
- Question limit enforcement
- Audit logging

## Default Admin Account

**Email:** hashimosman@synergyhomecare.com  
**Password:** Princess@2025

The admin account is automatically created when the app initializes. If needed, you can manually create it using the browser console:

```javascript
// In browser console
createAdminUser().then(result => console.log(result));
```

## Getting Started

### 1. User Registration Flow

1. User visits the application
2. If not logged in, they see the login screen
3. User clicks "Create account" to register
4. After successful registration, user sees "Account Pending" message
5. Admin receives notification of new user
6. Admin approves/rejects user from User Management dashboard
7. Upon approval, user can access the full platform

### 2. Admin Workflow

1. Login with admin credentials
2. Navigate to "User Management" (only visible to admins)
3. View pending users in real-time
4. Approve or reject new registrations
5. Manage existing users (enable/disable)
6. Monitor user activity and audit logs

### 3. User Experience

**For New Users:**
- Clean registration process
- Clear pending status communication
- Email notification planned for approval

**For Approved Users:**
- Full access to all features
- Question limit enforcement (1 per day)
- Personal data access only

**For Admins:**
- Additional navigation for user management
- Real-time pending user badges
- Complete user oversight

## Security Features

### 1. Firestore Security Rules
- Authenticated access only
- Role verification at database level
- Status checking for approved users
- User data isolation
- Admin-only operations protection

### 2. Client-Side Protection
- Route protection based on authentication status
- Role-based navigation
- Status-based access control
- Real-time authentication state management

### 3. Audit Trail
- User action logging
- Admin activity tracking
- Immutable audit records
- Approval/rejection history

## Daily Question Limit

Users are limited to 1 question per day:
- Counter resets at midnight
- Enforced at both client and server level
- Status tracked in user document
- Admin can view question activity

## Future Enhancements

### Planned Features
1. **Email Notifications** - Cloud Functions for user approval notifications
2. **DocuSeal Integration** - Document completion webhooks
3. **Enhanced Audit Trail** - Detailed user activity logs
4. **Bulk User Management** - Import/export users
5. **Custom Roles** - Additional role types beyond Admin/User

### Email Integration Setup
```javascript
// Cloud Function example for approval notifications
exports.notifyUserApproval = functions.firestore
  .document('users/{userId}')
  .onUpdate((change, context) => {
    const after = change.after.data();
    const before = change.before.data();
    
    if (before.status === 'pending' && after.status === 'approved') {
      // Send approval email
      return sendApprovalEmail(after.email, after.name);
    }
  });
```

## Testing the System

### Test Scenarios

1. **User Registration:**
   - Register new user
   - Verify pending status
   - Check admin notification

2. **Admin Approval:**
   - Login as admin
   - Approve pending user
   - Verify user can now access platform

3. **Question Limits:**
   - Submit question as user
   - Verify daily limit enforcement
   - Test reset after midnight

4. **User Management:**
   - Disable active user
   - Re-enable disabled user
   - Test access restrictions

## Troubleshooting

### Common Issues

1. **Admin User Not Created:**
   ```javascript
   // Browser console
   createAdminUser()
   ```

2. **Security Rules Not Applied:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **User Stuck in Pending:**
   - Check admin approval in User Management
   - Verify Firestore rules deployment
   - Check user document in Firebase Console

### Debug Tools

Access debug functions via browser console:
- `createAdminUser()` - Create admin account
- Check authentication state in React DevTools
- Monitor Firestore rules in Firebase Console

## Deployment Notes

1. Ensure Firestore security rules are deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Verify admin user creation on first app load

3. Test authentication flow in production environment

4. Monitor pending user approvals

## Support

For technical issues or questions about the user system implementation, refer to:
- Firebase Console for user and security monitoring
- React DevTools for authentication state debugging
- Browser console for manual admin operations
- Firestore rules simulator for permission testing

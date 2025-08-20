# Firebase Firestore Deployment Guide

## Deploying the updated Firestore configuration

After implementing the new Firebase services, you'll need to deploy the updated Firestore rules and indexes.

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### 3. Deploy Both Rules and Indexes
```bash
firebase deploy --only firestore
```

### 4. Full Firebase Deployment (if needed)
```bash
firebase deploy
```

## Important Notes

1. **Index Creation**: Firestore indexes can take several minutes to build, especially for large datasets.

2. **Testing**: Always test your rules in the Firebase Console's Rules Playground before deploying to production.

3. **Backup**: Consider backing up your existing rules and indexes before deploying changes.

4. **Monitoring**: Monitor the Firebase Console for any index build failures or rule deployment issues.

## New Collections Structure

- `calendarEvents` - Calendar events with date-based queries
- `announcements` - Updates/news with type filtering and expiration
- `resources` - File uploads with categorization and download tracking
- `questions` - Q&A system with answer subcollections
- `questions/{questionId}/answers` - Nested answers with voting system

## Security Rules Summary

- **Calendar Events**: Read access for approved users, write access for admins only
- **Announcements/Updates**: Read access for approved users, write access for admins only  
- **Resources**: Read access for approved users, write access for admins only
- **Questions**: Read/create access for approved users, update for authors/admins
- **Answers**: Read/create access for approved users, update for authors/admins, voting system included

## Index Benefits

The new indexes optimize queries for:
- Date-based calendar filtering
- Update type filtering and chronological ordering
- Resource categorization and popularity sorting
- Question resolution status and category filtering
- Answer voting and chronological display

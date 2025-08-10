# Firebase Integration Setup Guide

This document outlines the Firebase integration that has been added to the Horus Heresy 3.0 Army List Builder.

## What's Been Implemented

### 1. Firebase Configuration

- **File**: `src/config/firebase.ts`
- **Purpose**: Initializes Firebase app with environment variables
- **Services**: Authentication and Firestore

### 2. Authentication System

- **File**: `src/contexts/AuthContext.tsx`
- **Features**:
  - Google Sign-in with popup
  - User state management
  - Automatic auth state persistence
  - Sign out functionality
  - **Automatic data download on login**

### 3. Firestore Data Sync Service

- **File**: `src/services/firestoreService.ts`
- **Features**:
  - Sync all localStorage data to Firestore
  - Load data from Firestore to localStorage
  - Check for existing cloud data
  - Get last sync timestamp
  - Clear user data from Firestore

### 4. Enhanced Storage Classes

- **File**: `src/utils/enhancedCustomUnitStorage.ts`
- **Features**:
  - Automatic sync triggering on save/delete/update
  - Event-based change detection
  - Maintains compatibility with original storage API

- **File**: `src/utils/enhancedCustomDetachmentStorage.ts`
- **Features**:
  - Automatic sync triggering on save/delete/update
  - Event-based change detection
  - Maintains compatibility with original storage API

### 5. UI Components

- **LoginButton**: `src/components/LoginButton.tsx`
  - Google sign-in button
  - User profile display when signed in
  - Sign out functionality

- **SyncManager**: `src/components/SyncManager.tsx`
  - Cloud sync dialog
  - Sync to cloud functionality
  - Load from cloud functionality
  - Cloud status display

- **Auto-Sync Integration**: `src/hooks/useAutoSync.ts`
  - Automatic syncing on 1-minute intervals
  - Manual sync functionality
  - Sync status tracking
  - Error handling

- **LocalStorage Sync**: `src/hooks/useLocalStorageSync.ts`
  - Automatic syncing of custom units and detachments
  - Real-time change detection
  - Debounced sync to avoid excessive API calls
  - Cross-tab synchronization

### 6. Integration Points

- **MainMenu**: Updated to include login button and sync manager
- **App.tsx**: Wrapped with AuthProvider and localStorage sync
- **ArmyListBuilder**: Integrated with auto-sync functionality
- **Custom Units/Detachments Managers**: Updated to use enhanced storage classes
- **Environment Variables**: Configured for Firebase credentials

## Data Being Synced

The following localStorage data is synced to Firestore:

1. **Army Lists**: `heresy-3.0-army-lists`
2. **Army Lists Metadata**: `heresy-3.0-army-lists-metadata`
3. **Custom Detachments**: `customDetachments`
4. **Custom Detachments Metadata**: `customDetachmentsMetadata`
5. **Custom Units**: `heresy-custom-units`

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Analytics (optional)

### 2. Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable Google provider
3. Configure OAuth consent screen if needed

### 3. Set up Firestore Database

1. Go to Firestore Database
2. Create database in test mode
3. Deploy the security rules from `firestore.rules`

### 4. Get Configuration

1. Go to Project Settings > General
2. Add a web app
3. Copy the configuration object

### 5. Environment Variables

Create a `.env.local` file with:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Security Rules

The Firestore security rules ensure:

- Only authenticated users can access their own data
- Users can only read/write data under their own user ID
- All other access is denied

## Usage

### For Users

1. **Sign In**: Click "Sign In with Google" in the top-right corner
2. **Automatic Data Download**: Your data is automatically downloaded from Firestore when you sign in
3. **Automatic Custom Content Sync**: Custom units and detachments are automatically synced whenever they change
4. **Manual Sync**: Access "Cloud Sync" from the menu for manual sync operations
5. **Auto-Sync in Army Builder**:
   - Toggle "Auto-sync to cloud" switch to enable automatic syncing
   - Data syncs every minute while the army builder is open
   - Use "Sync Now" button for immediate sync
   - Monitor sync status and errors in real-time
6. **Cross-Device Access**: Your data is automatically available on any device when you sign in
7. **Real-Time Updates**: Changes to custom units and detachments sync immediately across all tabs

### For Developers

- The authentication state is available via `useAuth()` hook
- Firestore operations are handled by `FirestoreService` class
- Auto-sync functionality is available via `useAutoSync()` hook
- LocalStorage sync is available via `useLocalStorageSync()` hook
- Enhanced storage classes automatically trigger syncs on data changes
- All Firebase configuration is centralized in `src/config/firebase.ts`

## File Structure

```
src/
├── config/
│   └── firebase.ts              # Firebase configuration
├── contexts/
│   └── AuthContext.tsx          # Authentication context
├── services/
│   └── firestoreService.ts      # Firestore operations
├── hooks/
│   ├── useAutoSync.ts           # Auto-sync functionality
│   └── useLocalStorageSync.ts   # LocalStorage sync functionality
├── utils/
│   ├── enhancedCustomUnitStorage.ts      # Enhanced custom unit storage
│   └── enhancedCustomDetachmentStorage.ts # Enhanced custom detachment storage
├── components/
│   ├── LoginButton.tsx          # Login/logout UI
│   └── SyncManager.tsx          # Cloud sync UI
└── vite-env.d.ts               # Environment variable types
```

## Dependencies Added

- `firebase`: Firebase SDK for web applications

## Testing

To test the integration:

1. Set up Firebase project and environment variables
2. Run `npm run dev`
3. Click "Sign In with Google"
4. Create some army lists or custom content
5. Use the sync manager to test cloud functionality

## Notes

- The app continues to work without Firebase (localStorage only)
- Firebase integration is optional and only enabled when environment variables are set
- All existing functionality remains unchanged
- Data is synced as-is from localStorage to maintain compatibility
- Auto-sync is disabled by default and must be manually enabled by users
- Data is automatically downloaded from Firestore when users sign in
- Custom units and detachments are automatically synced whenever they change
- Enhanced storage classes maintain full compatibility with existing code

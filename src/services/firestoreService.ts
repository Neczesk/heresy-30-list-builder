import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from 'firebase/auth';

export interface SyncedData {
  armyLists: any;
  customDetachments: any;
  customUnits: any;
  lastSynced: string;
}

export class FirestoreService {
  private static getUserDoc(user: User, docName: string) {
    return doc(db, 'users', user.uid, 'data', docName);
  }

  /**
   * Sync all local storage data to Firestore
   */
  static async syncToFirestore(user: User): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Get all data from localStorage
      const armyLists = localStorage.getItem('heresy-3.0-army-lists');
      const armyListsMetadata = localStorage.getItem(
        'heresy-3.0-army-lists-metadata'
      );
      const customDetachments = localStorage.getItem('customDetachments');
      const customDetachmentsMetadata = localStorage.getItem(
        'customDetachmentsMetadata'
      );
      const customUnits = localStorage.getItem('heresy-custom-units');

      // Create synced data object
      const syncedData: SyncedData = {
        armyLists: armyLists ? JSON.parse(armyLists) : {},
        customDetachments: customDetachments
          ? JSON.parse(customDetachments)
          : {},
        customUnits: customUnits ? JSON.parse(customUnits) : {},
        lastSynced: new Date().toISOString(),
      };

      // Save to Firestore
      const userDataDoc = this.getUserDoc(user, 'syncedData');
      batch.set(userDataDoc, syncedData);

      // Also save metadata separately for easier querying
      if (armyListsMetadata) {
        const metadataDoc = this.getUserDoc(user, 'armyListsMetadata');
        batch.set(metadataDoc, { data: JSON.parse(armyListsMetadata) });
      }

      if (customDetachmentsMetadata) {
        const metadataDoc = this.getUserDoc(user, 'customDetachmentsMetadata');
        batch.set(metadataDoc, { data: JSON.parse(customDetachmentsMetadata) });
      }

      await batch.commit();
      console.log('Data synced to Firestore successfully');
    } catch (error) {
      console.error('Error syncing to Firestore:', error);
      throw error;
    }
  }

  /**
   * Load all data from Firestore to localStorage
   */
  static async loadFromFirestore(user: User): Promise<void> {
    try {
      const userDataDoc = this.getUserDoc(user, 'syncedData');
      const docSnap = await getDoc(userDataDoc);

      if (docSnap.exists()) {
        const data = docSnap.data() as SyncedData;

        // Restore data to localStorage
        if (data.armyLists) {
          localStorage.setItem(
            'heresy-3.0-army-lists',
            JSON.stringify(data.armyLists)
          );
        }

        if (data.customDetachments) {
          localStorage.setItem(
            'customDetachments',
            JSON.stringify(data.customDetachments)
          );
        }

        if (data.customUnits) {
          localStorage.setItem(
            'heresy-custom-units',
            JSON.stringify(data.customUnits)
          );
        }

        // Load metadata
        const armyListsMetadataDoc = this.getUserDoc(user, 'armyListsMetadata');
        const armyListsMetadataSnap = await getDoc(armyListsMetadataDoc);
        if (armyListsMetadataSnap.exists()) {
          const metadata = armyListsMetadataSnap.data();
          localStorage.setItem(
            'heresy-3.0-army-lists-metadata',
            JSON.stringify(metadata.data)
          );
        }

        const customDetachmentsMetadataDoc = this.getUserDoc(
          user,
          'customDetachmentsMetadata'
        );
        const customDetachmentsMetadataSnap = await getDoc(
          customDetachmentsMetadataDoc
        );
        if (customDetachmentsMetadataSnap.exists()) {
          const metadata = customDetachmentsMetadataSnap.data();
          localStorage.setItem(
            'customDetachmentsMetadata',
            JSON.stringify(metadata.data)
          );
        }

        console.log('Data loaded from Firestore successfully');
      } else {
        console.log('No synced data found in Firestore');
      }
    } catch (error) {
      console.error('Error loading from Firestore:', error);
      throw error;
    }
  }

  /**
   * Check if user has synced data in Firestore
   */
  static async hasSyncedData(user: User): Promise<boolean> {
    try {
      const userDataDoc = this.getUserDoc(user, 'syncedData');
      const docSnap = await getDoc(userDataDoc);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking for synced data:', error);
      return false;
    }
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSyncTime(user: User): Promise<string | null> {
    try {
      const userDataDoc = this.getUserDoc(user, 'syncedData');
      const docSnap = await getDoc(userDataDoc);

      if (docSnap.exists()) {
        const data = docSnap.data() as SyncedData;
        return data.lastSynced;
      }

      return null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Clear all user data from Firestore
   */
  static async clearUserData(user: User): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete all user documents
      const userDataDoc = this.getUserDoc(user, 'syncedData');
      const armyListsMetadataDoc = this.getUserDoc(user, 'armyListsMetadata');
      const customDetachmentsMetadataDoc = this.getUserDoc(
        user,
        'customDetachmentsMetadata'
      );

      batch.delete(userDataDoc);
      batch.delete(armyListsMetadataDoc);
      batch.delete(customDetachmentsMetadataDoc);

      await batch.commit();
      console.log('User data cleared from Firestore');
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }
}

import { v4 as uuidv4 } from 'uuid';
import type {
  Army,
  StoredArmyList,
  ArmyListMetadata,
  Allegiance,
} from '../types/army';

const STORAGE_KEY = 'heresy-3.0-army-lists';
const METADATA_KEY = 'heresy-3.0-army-lists-metadata';

export class ArmyListStorage {
  // Generate a new UUID for army lists
  static generateId(): string {
    return uuidv4();
  }

  // Get current timestamp
  static getTimestamp(): string {
    return new Date().toISOString();
  }

  // Create a new empty army list
  static createNewArmyList(
    faction: string,
    pointsLimit: number,
    allegiance: Allegiance
  ): Army {
    return {
      id: this.generateId(),
      name: 'New Army List',
      faction,
      allegiance,
      pointsLimit,
      totalPoints: 0,
      detachments: [],
      validationErrors: [],
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
      isNamed: false,
    };
  }

  // Save an army list to local storage
  static saveArmyList(armyList: Army): void {
    try {
      // Update the timestamp
      armyList.updatedAt = this.getTimestamp();

      // Save the full army list data
      const storedList: StoredArmyList = {
        id: armyList.id,
        name: armyList.name,
        data: armyList,
        isNamed: armyList.isNamed,
        createdAt: armyList.createdAt,
        updatedAt: armyList.updatedAt,
      };

      const existingLists = this.getAllStoredLists();
      existingLists[armyList.id] = storedList;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLists));

      // Update metadata for quick access
      this.updateMetadata(armyList);

      console.log(`Army list ${armyList.id} saved to local storage`);
    } catch (error) {
      console.error('Error saving army list:', error);
    }
  }

  // Load an army list from local storage
  static loadArmyList(id: string): Army | null {
    try {
      const storedLists = this.getAllStoredLists();
      const storedList = storedLists[id];

      if (storedList) {
        return storedList.data;
      }

      return null;
    } catch (error) {
      console.error('Error loading army list:', error);
      return null;
    }
  }

  // Get all army list metadata (for the load list menu)
  static getAllArmyListMetadata(): ArmyListMetadata[] {
    try {
      const metadata = localStorage.getItem(METADATA_KEY);
      if (metadata) {
        return JSON.parse(metadata);
      }
      return [];
    } catch (error) {
      console.error('Error loading army list metadata:', error);
      return [];
    }
  }

  // Delete an army list
  static deleteArmyList(id: string): boolean {
    try {
      const storedLists = this.getAllStoredLists();
      delete storedLists[id];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedLists));

      // Update metadata
      this.updateMetadataList();

      console.log(`Army list ${id} deleted from local storage`);
      return true;
    } catch (error) {
      console.error('Error deleting army list:', error);
      return false;
    }
  }

  // Rename an army list (makes it "permanent")
  static renameArmyList(id: string, newName: string): boolean {
    try {
      const armyList = this.loadArmyList(id);
      if (!armyList) return false;

      armyList.name = newName;
      armyList.isNamed = true;
      armyList.updatedAt = this.getTimestamp();

      this.saveArmyList(armyList);
      return true;
    } catch (error) {
      console.error('Error renaming army list:', error);
      return false;
    }
  }

  // Clean up unnamed lists older than 24 hours
  static cleanupUnnamedLists(): void {
    try {
      const storedLists = this.getAllStoredLists();
      const now = new Date();
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      let hasChanges = false;

      Object.keys(storedLists).forEach(id => {
        const list = storedLists[id];
        if (!list.isNamed) {
          const createdAt = new Date(list.createdAt);
          if (createdAt < cutoff) {
            delete storedLists[id];
            hasChanges = true;
            console.log(`Cleaned up unnamed army list ${id}`);
          }
        }
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedLists));
        this.updateMetadataList();
      }
    } catch (error) {
      console.error('Error cleaning up unnamed lists:', error);
    }
  }

  // Private helper methods
  private static getAllStoredLists(): Record<string, StoredArmyList> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting stored lists:', error);
      return {};
    }
  }

  private static updateMetadata(armyList: Army): void {
    try {
      const metadata: ArmyListMetadata = {
        id: armyList.id,
        name: armyList.name,
        faction: armyList.faction,
        allegiance: armyList.allegiance,
        pointsLimit: armyList.pointsLimit,
        totalPoints: armyList.totalPoints,
        isNamed: armyList.isNamed,
        createdAt: armyList.createdAt,
        updatedAt: armyList.updatedAt,
      };

      const allMetadata = this.getAllArmyListMetadata();
      const existingIndex = allMetadata.findIndex(m => m.id === armyList.id);

      if (existingIndex >= 0) {
        allMetadata[existingIndex] = metadata;
      } else {
        allMetadata.push(metadata);
      }

      // Sort by updatedAt (newest first)
      allMetadata.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      localStorage.setItem(METADATA_KEY, JSON.stringify(allMetadata));
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  }

  private static updateMetadataList(): void {
    try {
      const storedLists = this.getAllStoredLists();
      const metadata: ArmyListMetadata[] = Object.values(storedLists).map(
        list => ({
          id: list.id,
          name: list.name,
          faction: list.data.faction,
          allegiance: list.data.allegiance,
          pointsLimit: list.data.pointsLimit,
          totalPoints: list.data.totalPoints,
          isNamed: list.isNamed,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        })
      );

      // Sort by updatedAt (newest first)
      metadata.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error updating metadata list:', error);
    }
  }
}

import type { CustomUnit } from '../types/army';
import { CustomUnitStorage } from './customUnitStorage';

// Event emitter for storage changes
class StorageEventEmitter {
  private listeners: { [key: string]: (() => void)[] } = {};

  on(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }

  off(event: string, callback: () => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        cb => cb !== callback
      );
    }
  }
}

export const customUnitStorageEvents = new StorageEventEmitter();

export class EnhancedCustomUnitStorage {
  /**
   * Save a custom unit to local storage and trigger sync
   */
  static saveCustomUnit(customUnit: CustomUnit): void {
    try {
      // Use the original storage method
      CustomUnitStorage.saveCustomUnit(customUnit);

      // Emit change event to trigger sync
      customUnitStorageEvents.emit('customUnitsChanged');

      console.log('Custom unit saved and sync triggered:', customUnit.id);
    } catch (error) {
      console.error('Failed to save custom unit:', error);
      throw error;
    }
  }

  /**
   * Delete a custom unit and trigger sync
   */
  static deleteCustomUnit(id: string): boolean {
    try {
      const result = CustomUnitStorage.deleteCustomUnit(id);

      if (result) {
        // Emit change event to trigger sync
        customUnitStorageEvents.emit('customUnitsChanged');
        console.log('Custom unit deleted and sync triggered:', id);
      }

      return result;
    } catch (error) {
      console.error('Failed to delete custom unit:', error);
      return false;
    }
  }

  /**
   * Update a custom unit and trigger sync
   */
  static updateCustomUnit(customUnit: CustomUnit): void {
    try {
      // Update the timestamp
      customUnit.updatedAt = new Date().toISOString();

      // Use the original storage method
      CustomUnitStorage.saveCustomUnit(customUnit);

      // Emit change event to trigger sync
      customUnitStorageEvents.emit('customUnitsChanged');

      console.log('Custom unit updated and sync triggered:', customUnit.id);
    } catch (error) {
      console.error('Failed to update custom unit:', error);
      throw error;
    }
  }

  // Delegate all other methods to the original storage class
  static getCustomUnit = CustomUnitStorage.getCustomUnit;
  static getAllCustomUnits = CustomUnitStorage.getAllCustomUnits;
  static getAllCustomUnitMetadata = CustomUnitStorage.getAllCustomUnitMetadata;
  static isNameTaken = CustomUnitStorage.isNameTaken;
  static generateId = CustomUnitStorage.generateId;
  static createCustomUnitFromArmyUnit =
    CustomUnitStorage.createCustomUnitFromArmyUnit;
}

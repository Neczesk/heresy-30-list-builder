import type { CustomDetachment } from '../types/army';
import { CustomDetachmentStorage } from './customDetachmentStorage';

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

export const customDetachmentStorageEvents = new StorageEventEmitter();

export class EnhancedCustomDetachmentStorage {
  /**
   * Save a custom detachment to local storage and trigger sync
   */
  static saveCustomDetachment(customDetachment: CustomDetachment): void {
    try {
      // Use the original storage method
      CustomDetachmentStorage.saveCustomDetachment(customDetachment);

      // Emit change event to trigger sync
      customDetachmentStorageEvents.emit('customDetachmentsChanged');

      console.log(
        'Custom detachment saved and sync triggered:',
        customDetachment.id
      );
    } catch (error) {
      console.error('Failed to save custom detachment:', error);
      throw error;
    }
  }

  /**
   * Delete a custom detachment and trigger sync
   */
  static deleteCustomDetachment(id: string): boolean {
    try {
      const result = CustomDetachmentStorage.deleteCustomDetachment(id);

      if (result) {
        // Emit change event to trigger sync
        customDetachmentStorageEvents.emit('customDetachmentsChanged');
        console.log('Custom detachment deleted and sync triggered:', id);
      }

      return result;
    } catch (error) {
      console.error('Failed to delete custom detachment:', error);
      return false;
    }
  }

  /**
   * Update a custom detachment and trigger sync
   */
  static updateCustomDetachment(customDetachment: CustomDetachment): void {
    try {
      // Update the timestamp
      customDetachment.updatedAt = new Date().toISOString();

      // Use the original storage method
      CustomDetachmentStorage.saveCustomDetachment(customDetachment);

      // Emit change event to trigger sync
      customDetachmentStorageEvents.emit('customDetachmentsChanged');

      console.log(
        'Custom detachment updated and sync triggered:',
        customDetachment.id
      );
    } catch (error) {
      console.error('Failed to update custom detachment:', error);
      throw error;
    }
  }

  // Delegate all other methods to the original storage class
  static getCustomDetachment = CustomDetachmentStorage.getCustomDetachment;
  static getAllCustomDetachments =
    CustomDetachmentStorage.getAllCustomDetachments;
  static getAllCustomDetachmentMetadata =
    CustomDetachmentStorage.getAllCustomDetachmentMetadata;
  static createCustomDetachment =
    CustomDetachmentStorage.createCustomDetachment;

  // Create our own generateId function since the original is private
  static generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
}

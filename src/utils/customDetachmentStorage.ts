import type { CustomDetachment, CustomDetachmentMetadata } from '../types/army';

const CUSTOM_DETACHMENTS_KEY = 'customDetachments';
const CUSTOM_DETACHMENTS_METADATA_KEY = 'customDetachmentsMetadata';

export class CustomDetachmentStorage {
  private static generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  static saveCustomDetachment(customDetachment: CustomDetachment): void {
    try {
      // Get existing custom detachments
      const existingData = localStorage.getItem(CUSTOM_DETACHMENTS_KEY);
      const customDetachments: { [id: string]: CustomDetachment } = existingData ? JSON.parse(existingData) : {};

      // Save the custom detachment
      customDetachments[customDetachment.id] = customDetachment;
      localStorage.setItem(CUSTOM_DETACHMENTS_KEY, JSON.stringify(customDetachments));

      // Update metadata
      this.updateMetadata(customDetachment);

      console.log('Custom detachment saved:', customDetachment.id);
    } catch (error) {
      console.error('Error saving custom detachment:', error);
    }
  }

  static getCustomDetachment(id: string): CustomDetachment | null {
    try {
      const existingData = localStorage.getItem(CUSTOM_DETACHMENTS_KEY);
      const customDetachments: { [id: string]: CustomDetachment } = existingData ? JSON.parse(existingData) : {};
      
      return customDetachments[id] || null;
    } catch (error) {
      console.error('Error loading custom detachment:', error);
      return null;
    }
  }

  static getAllCustomDetachments(): CustomDetachment[] {
    try {
      const existingData = localStorage.getItem(CUSTOM_DETACHMENTS_KEY);
      const customDetachments: { [id: string]: CustomDetachment } = existingData ? JSON.parse(existingData) : {};
      
      return Object.values(customDetachments);
    } catch (error) {
      console.error('Error loading all custom detachments:', error);
      return [];
    }
  }

  static getAllCustomDetachmentMetadata(): CustomDetachmentMetadata[] {
    try {
      const existingData = localStorage.getItem(CUSTOM_DETACHMENTS_METADATA_KEY);
      const metadata: { [id: string]: CustomDetachmentMetadata } = existingData ? JSON.parse(existingData) : {};
      
      return Object.values(metadata).sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error loading custom detachment metadata:', error);
      return [];
    }
  }

  static deleteCustomDetachment(id: string): boolean {
    try {
      // Remove from main storage
      const existingData = localStorage.getItem(CUSTOM_DETACHMENTS_KEY);
      const customDetachments: { [id: string]: CustomDetachment } = existingData ? JSON.parse(existingData) : {};
      
      if (customDetachments[id]) {
        delete customDetachments[id];
        localStorage.setItem(CUSTOM_DETACHMENTS_KEY, JSON.stringify(customDetachments));

        // Remove from metadata
        const metadataData = localStorage.getItem(CUSTOM_DETACHMENTS_METADATA_KEY);
        const metadata: { [id: string]: CustomDetachmentMetadata } = metadataData ? JSON.parse(metadataData) : {};
        
        if (metadata[id]) {
          delete metadata[id];
          localStorage.setItem(CUSTOM_DETACHMENTS_METADATA_KEY, JSON.stringify(metadata));
        }

        console.log('Custom detachment deleted:', id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting custom detachment:', error);
      return false;
    }
  }

  private static updateMetadata(customDetachment: CustomDetachment): void {
    try {
      const existingData = localStorage.getItem(CUSTOM_DETACHMENTS_METADATA_KEY);
      const metadata: { [id: string]: CustomDetachmentMetadata } = existingData ? JSON.parse(existingData) : {};

      metadata[customDetachment.id] = {
        id: customDetachment.id,
        name: customDetachment.name,
        baseDetachmentId: customDetachment.baseDetachmentId,
        faction: customDetachment.faction,
        subfaction: customDetachment.subfaction,
        customName: customDetachment.customName,
        description: customDetachment.description,
        createdAt: customDetachment.createdAt,
        updatedAt: customDetachment.updatedAt
      };

      localStorage.setItem(CUSTOM_DETACHMENTS_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error updating custom detachment metadata:', error);
    }
  }

  static createCustomDetachment(
    name: string,
    baseDetachmentId: string,
    faction: string,
    subfaction: string | undefined,
    customName: string | undefined,
    description: string,
    units: any[],
    primeAdvantages: any[]
  ): CustomDetachment {
    const id = this.generateId(name);
    const now = new Date().toISOString();

    return {
      id,
      name,
      baseDetachmentId,
      faction,
      subfaction,
      customName,
      description,
      units,
      primeAdvantages,
      createdAt: now,
      updatedAt: now
    };
  }
} 
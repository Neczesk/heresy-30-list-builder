import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { customUnitStorageEvents } from '../utils/enhancedCustomUnitStorage';
import { customDetachmentStorageEvents } from '../utils/enhancedCustomDetachmentStorage';

interface UseLocalStorageSyncOptions {
  enabled?: boolean;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export const useLocalStorageSync = (
  options: UseLocalStorageSyncOptions = {}
) => {
  const { enabled = true, onSyncStart, onSyncComplete, onSyncError } = options;

  const { currentUser } = useAuth();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCustomUnitsRef = useRef<string>('');
  const lastCustomDetachmentsRef = useRef<string>('');

  // Debounced sync function to avoid excessive API calls
  const debouncedSync = () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (!currentUser || !enabled) return;

      try {
        onSyncStart?.();
        await FirestoreService.syncToFirestore(currentUser);
        onSyncComplete?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown sync error';
        onSyncError?.(error instanceof Error ? error : new Error(errorMessage));
        console.error('LocalStorage sync error:', error);
      }
    }, 1000); // 1 second debounce
  };

  // Check for changes in localStorage
  const checkForChanges = () => {
    if (!currentUser || !enabled) return;

    try {
      // Get current custom units
      const customUnits = localStorage.getItem('heresy-custom-units') || '';
      const customDetachments = localStorage.getItem('customDetachments') || '';

      // Check if there are changes
      const unitsChanged = customUnits !== lastCustomUnitsRef.current;
      const detachmentsChanged =
        customDetachments !== lastCustomDetachmentsRef.current;

      if (unitsChanged || detachmentsChanged) {
        // Update our refs
        lastCustomUnitsRef.current = customUnits;
        lastCustomDetachmentsRef.current = customDetachments;

        // Trigger sync
        debouncedSync();
      }
    } catch (error) {
      console.error('Error checking for localStorage changes:', error);
    }
  };

  // Set up storage event listener for cross-tab changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === 'heresy-custom-units' ||
        event.key === 'customDetachments' ||
        event.key === 'customDetachmentsMetadata'
      ) {
        checkForChanges();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser, enabled]);

  // Set up event listeners for storage changes
  useEffect(() => {
    if (!currentUser || !enabled) return;

    const handleCustomUnitsChange = () => {
      debouncedSync();
    };

    const handleCustomDetachmentsChange = () => {
      debouncedSync();
    };

    // Listen to storage events
    customUnitStorageEvents.on('customUnitsChanged', handleCustomUnitsChange);
    customDetachmentStorageEvents.on(
      'customDetachmentsChanged',
      handleCustomDetachmentsChange
    );

    return () => {
      customUnitStorageEvents.off(
        'customUnitsChanged',
        handleCustomUnitsChange
      );
      customDetachmentStorageEvents.off(
        'customDetachmentsChanged',
        handleCustomDetachmentsChange
      );
    };
  }, [currentUser, enabled]);

  // Set up polling for changes (in case storage events don't fire)
  useEffect(() => {
    if (!currentUser || !enabled) return;

    const interval = setInterval(checkForChanges, 2000); // Check every 2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, enabled]);

  // Initialize refs with current values
  useEffect(() => {
    if (currentUser && enabled) {
      lastCustomUnitsRef.current =
        localStorage.getItem('heresy-custom-units') || '';
      lastCustomDetachmentsRef.current =
        localStorage.getItem('customDetachments') || '';
    }
  }, [currentUser, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    checkForChanges,
  };
};

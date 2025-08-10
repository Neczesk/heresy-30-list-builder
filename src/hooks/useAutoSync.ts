import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';

interface UseAutoSyncOptions {
  enabled?: boolean;
  intervalMs?: number;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export const useAutoSync = (options: UseAutoSyncOptions = {}) => {
  const {
    enabled = true,
    intervalMs = 60000, // 1 minute default
    onSyncStart,
    onSyncComplete,
    onSyncError,
  } = options;

  const { currentUser } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = async () => {
    if (!currentUser || !enabled) return;

    try {
      setIsSyncing(true);
      setSyncError(null);
      onSyncStart?.();

      await FirestoreService.syncToFirestore(currentUser);

      setLastSyncTime(new Date());
      onSyncComplete?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown sync error';
      setSyncError(errorMessage);
      onSyncError?.(error instanceof Error ? error : new Error(errorMessage));
      console.error('Auto sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Start auto-sync interval
  useEffect(() => {
    if (!currentUser || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Perform initial sync
    performSync();

    // Set up interval for subsequent syncs
    intervalRef.current = setInterval(performSync, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentUser, enabled, intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const manualSync = async () => {
    await performSync();
  };

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    manualSync,
  };
};

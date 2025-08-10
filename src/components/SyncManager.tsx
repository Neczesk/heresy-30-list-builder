import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CloudUpload, CloudDownload } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';

interface SyncManagerProps {
  open: boolean;
  onClose: () => void;
}

export const SyncManager: React.FC<SyncManagerProps> = ({ open, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasCloudData, setHasCloudData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && currentUser) {
      checkCloudData();
    }
  }, [open, currentUser]);

  const checkCloudData = async () => {
    if (!currentUser) return;

    try {
      const hasData = await FirestoreService.hasSyncedData(currentUser);
      setHasCloudData(hasData);

      if (hasData) {
        const lastSync = await FirestoreService.getLastSyncTime(currentUser);
        setLastSyncTime(lastSync);
      }
    } catch (error) {
      console.error('Error checking cloud data:', error);
      setError('Failed to check cloud data');
    }
  };

  const handleSyncToCloud = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await FirestoreService.syncToFirestore(currentUser);
      setSuccess('Data synced to cloud successfully!');
      await checkCloudData();
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      setError('Failed to sync data to cloud');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await FirestoreService.loadFromFirestore(currentUser);
      setSuccess('Data loaded from cloud successfully!');
      await checkCloudData();
      // Reload the page to reflect the loaded data
      window.location.reload();
    } catch (error) {
      console.error('Error loading from cloud:', error);
      setError('Failed to load data from cloud');
    } finally {
      setLoading(false);
    }
  };

  const formatLastSyncTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cloud Sync Manager</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Sync your army lists, custom detachments, and custom units to the
            cloud to access them from any device.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Cloud Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <Chip
              label={hasCloudData ? 'Data Available' : 'No Data'}
              color={hasCloudData ? 'success' : 'default'}
              size="small"
            />
          </Box>
          {lastSyncTime && (
            <Typography variant="body2" color="text.secondary">
              Last synced: {formatLastSyncTime(lastSyncTime)}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={
              loading ? <CircularProgress size={20} /> : <CloudUpload />
            }
            onClick={handleSyncToCloud}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Syncing...' : 'Sync to Cloud'}
          </Button>

          {hasCloudData && (
            <Button
              variant="outlined"
              startIcon={
                loading ? <CircularProgress size={20} /> : <CloudDownload />
              }
              onClick={handleLoadFromCloud}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Loading...' : 'Load from Cloud'}
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Loading from cloud will replace all current
            local data. Make sure to sync your current data first if you want to
            keep it.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

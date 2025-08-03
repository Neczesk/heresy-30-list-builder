import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { CustomDetachmentStorage } from '../../utils/customDetachmentStorage';
import type { CustomDetachmentMetadata, ArmyDetachment } from '../../types/army';

interface LoadCustomDetachmentModalProps {
  isOpen: boolean;
  baseDetachmentId: string;
  currentDetachment: ArmyDetachment;
  onClose: () => void;
  onLoad: (customDetachment: any) => void;
}

const LoadCustomDetachmentModal: React.FC<LoadCustomDetachmentModalProps> = ({
  isOpen,
  baseDetachmentId,
  currentDetachment,
  onClose,
  onLoad,
}) => {
  const [customDetachments, setCustomDetachments] = useState<
    CustomDetachmentMetadata[]
  >([]);
  const [selectedDetachment, setSelectedDetachment] = useState<string | null>(
    null
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load custom detachments with the same base detachment ID
      const allCustomDetachments =
        CustomDetachmentStorage.getAllCustomDetachmentMetadata();
      const matchingDetachments = allCustomDetachments.filter(
        cd => cd.baseDetachmentId === baseDetachmentId
      );
      setCustomDetachments(matchingDetachments);
      setSelectedDetachment(null);
      setError('');
    }
  }, [isOpen, baseDetachmentId]);

  const handleLoad = () => {
    if (!selectedDetachment) {
      setError('Please select a custom detachment to load.');
      return;
    }

    try {
      const customDetachment =
        CustomDetachmentStorage.getCustomDetachment(selectedDetachment);
      if (!customDetachment) {
        setError('Selected custom detachment not found.');
        return;
      }

      onLoad(customDetachment);
    } catch (error) {
      console.error('Error loading custom detachment:', error);
      setError('Failed to load custom detachment. Please try again.');
    }
  };

  const handleDetachmentSelect = (detachmentId: string) => {
    setSelectedDetachment(detachmentId);
    setError('');
  };

  const currentPoints = currentDetachment.units.reduce(
    (total, unit) => total + unit.points,
    0
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h3">
            Load Custom Detachment
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Current Detachment Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Detachment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Loading a custom detachment will overwrite the current configuration.
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Base Detachment:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {baseDetachmentId}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Current Units:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {currentDetachment.units.length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Current Points:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {currentPoints} pts
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Custom Detachments List */}
        {customDetachments.length === 0 ? (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body1" sx={{ mb: 1 }}>
                No custom detachments found for this base detachment.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Save a custom detachment first to load it here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Available Custom Detachments ({customDetachments.length})
            </Typography>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2
            }}>
              {customDetachments.map(detachment => (
                <Card
                  key={detachment.id}
                  variant={selectedDetachment === detachment.id ? 'elevation' : 'outlined'}
                  elevation={selectedDetachment === detachment.id ? 4 : 1}
                  sx={{
                    cursor: 'pointer',
                    borderColor: selectedDetachment === detachment.id ? 'primary.main' : undefined,
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => handleDetachmentSelect(detachment.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h4">
                        {detachment.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(detachment.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {detachment.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={detachment.faction}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      {detachment.subfaction && (
                        <Chip
                          label={detachment.subfaction}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        {customDetachments.length > 0 && (
          <Button
            variant="contained"
            onClick={handleLoad}
            disabled={!selectedDetachment}
          >
            Load Custom Detachment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LoadCustomDetachmentModal;

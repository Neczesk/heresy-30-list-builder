import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Alert,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { EnhancedCustomDetachmentStorage } from '../../utils/enhancedCustomDetachmentStorage';
import type { ArmyDetachment } from '../../types/army';

interface SaveCustomDetachmentModalProps {
  isOpen: boolean;
  detachment: ArmyDetachment;
  faction: string;
  subfaction?: string;
  onClose: () => void;
  onSaved: (customDetachmentId: string) => void;
}

const SaveCustomDetachmentModal: React.FC<SaveCustomDetachmentModalProps> = ({
  isOpen,
  detachment,
  faction,
  subfaction,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a name for your custom detachment.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for your custom detachment.');
      return;
    }

    try {
      const customDetachment =
        EnhancedCustomDetachmentStorage.createCustomDetachment(
          name.trim(),
          detachment.detachmentId,
          faction,
          subfaction,
          detachment.customName,
          description.trim(),
          detachment.units,
          detachment.primeAdvantages
        );

      EnhancedCustomDetachmentStorage.saveCustomDetachment(customDetachment);
      onSaved(customDetachment.id);
    } catch (error) {
      console.error('Error saving custom detachment:', error);
      setError('Failed to save custom detachment. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Save Custom Detachment</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Detachment Name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a name for your custom detachment"
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your custom detachment configuration"
            multiline
            rows={4}
            inputProps={{ maxLength: 500 }}
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detachment Preview
              </Typography>
              <Stack spacing={1}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Base Detachment:
                  </Typography>
                  <Typography variant="body2">
                    {detachment.detachmentId}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Faction:
                  </Typography>
                  <Typography variant="body2">{faction}</Typography>
                </Box>
                {subfaction && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Subfaction:
                    </Typography>
                    <Typography variant="body2">{subfaction}</Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Units:
                  </Typography>
                  <Typography variant="body2">
                    {detachment.units.length}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Prime Advantages:
                  </Typography>
                  <Typography variant="body2">
                    {detachment.primeAdvantages.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={handleSave}>
          Save Custom Detachment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveCustomDetachmentModal;

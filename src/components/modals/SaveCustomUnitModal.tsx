import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { CustomUnitStorage } from '../../utils/customUnitStorage';
import type { ArmyUnit } from '../../types/army';

interface SaveCustomUnitModalProps {
  isOpen: boolean;
  unit: ArmyUnit;
  faction: string;
  subfaction?: string;
  onClose: () => void;
  onSaved?: (customUnitId: string) => void;
}

const SaveCustomUnitModal: React.FC<SaveCustomUnitModalProps> = ({
  isOpen,
  unit,
  faction,
  subfaction,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isNameTaken, setIsNameTaken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
      setIsNameTaken(false);
    }
  }, [isOpen]);

  // Check if name is taken when name changes
  useEffect(() => {
    if (name.trim()) {
      const taken = CustomUnitStorage.isNameTaken(name.trim());
      setIsNameTaken(taken);
    } else {
      setIsNameTaken(false);
    }
  }, [name]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for your custom unit');
      return;
    }

    if (isNameTaken) {
      setError('A custom unit with this name already exists');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const customUnit = CustomUnitStorage.createCustomUnitFromArmyUnit(
        name.trim(),
        unit,
        faction,
        subfaction,
        description.trim() || undefined
      );

      CustomUnitStorage.saveCustomUnit(customUnit);

      if (onSaved) {
        onSaved(customUnit.id);
      }

      onClose();
    } catch (err) {
      setError('Failed to save custom unit. Please try again.');
      console.error('Error saving custom unit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      maxWidth="sm"
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
            Save Custom Unit
          </Typography>
          <Button
            onClick={handleCancel}
            size="small"
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Unit Name Field */}
          <TextField
            label="Unit Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for your custom unit"
            error={isNameTaken}
            helperText={isNameTaken ? 'A custom unit with this name already exists' : ''}
            disabled={isSaving}
            fullWidth
          />

          {/* Description Field */}
          <TextField
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for your custom unit"
            multiline
            rows={3}
            disabled={isSaving}
            fullWidth
          />

          {/* Unit Preview Card */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Unit Preview
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Base Unit:
                  </Typography>
                  <Typography variant="body2">
                    {unit.unitId}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Faction:
                  </Typography>
                  <Typography variant="body2">
                    {faction}
                  </Typography>
                </Box>
                {subfaction && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Subfaction:
                    </Typography>
                    <Typography variant="body2">
                      {subfaction}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Upgrades:
                  </Typography>
                  <Chip
                    label={`${unit.upgrades?.length || 0} applied`}
                    size="small"
                    variant="outlined"
                    color={unit.upgrades?.length > 0 ? "primary" : "default"}
                  />
                </Box>
                {unit.primeAdvantages && unit.primeAdvantages.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Prime Advantages:
                    </Typography>
                    <Chip
                      label={`${unit.primeAdvantages.length} applied`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !name.trim() || isNameTaken}
          startIcon={<Save />}
        >
          {isSaving ? 'Saving...' : 'Save Custom Unit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveCustomUnitModal;

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface UnitRemoveConfirmationModalProps {
  isOpen: boolean;
  unitName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const UnitRemoveConfirmationModal: React.FC<UnitRemoveConfirmationModalProps> = ({
  isOpen,
  unitName,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          <Typography variant="h6">
            Remove Unit
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to remove "{unitName}"?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This will also remove any detachments that were triggered by this unit.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
        >
          Yes, Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnitRemoveConfirmationModal;

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import DetachmentSelector from '../DetachmentSelector';
import type { Detachment, Faction, Allegiance } from '../../types/army';

interface FactionSelectionModalProps {
  isOpen: boolean;
  onDetachmentSelected: (
    detachment: Detachment,
    faction: Faction,
    allegiance: Allegiance,
    subFaction?: Faction
  ) => void;
  onCancel: () => void;
}

const FactionSelectionModal: React.FC<FactionSelectionModalProps> = ({
  isOpen,
  onDetachmentSelected,
  onCancel,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            Create New Army List
          </Typography>
          <IconButton onClick={onCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DetachmentSelector
          onDetachmentSelected={onDetachmentSelected}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FactionSelectionModal;

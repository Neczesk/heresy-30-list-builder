import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { Help } from '@mui/icons-material';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  helpContent: { title: string; content: React.ReactNode };
}

export const HelpModal: React.FC<HelpModalProps> = ({
  open,
  onClose,
  helpContent,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Help color="primary" />
          <Typography variant="h6">
            {helpContent.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {helpContent.content}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

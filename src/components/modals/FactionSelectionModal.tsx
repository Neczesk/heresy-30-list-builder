import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          maxHeight: isMobile ? '100vh' : '90vh',
          height: isMobile ? '100vh' : 'auto'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: { xs: 2, sm: 3 },
        pb: { xs: 1, sm: 2 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant={isMobile ? "h5" : "h5"}>
            Create New Army List
          </Typography>
          <IconButton 
            onClick={onCancel} 
            size={isMobile ? "medium" : "small"}
            sx={{ 
              p: { xs: 1, sm: 0.5 }
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 },
        pt: { xs: 0, sm: 1 }
      }}>
        <DetachmentSelector
          onDetachmentSelected={onDetachmentSelected}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FactionSelectionModal;

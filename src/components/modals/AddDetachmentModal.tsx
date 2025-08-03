import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import AlliedFactionSelector from '../../pages/listBuilder/AlliedFactionSelector';
import DetachmentSlots from '../../pages/listBuilder/DetachmentSlots';
import type { Army, Detachment, Faction } from '../../types/army';

interface AddDetachmentModalProps {
  isOpen: boolean;
  armyList: Army;
  onAddDetachment: (detachment: Detachment) => void;
  onClose: () => void;
}

const AddDetachmentModal: React.FC<AddDetachmentModalProps> = ({
  isOpen,
  armyList,
  onAddDetachment,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAlliedSelector, setShowAlliedSelector] = useState(false);

  const availableDetachments = DataLoader.getAvailableDetachments(
    armyList
  ).filter(d => d.id !== 'crusade-primary');

  const detachmentTypes = [
    { id: 'all', name: 'All Available' },
    { id: 'Auxiliary', name: 'Auxiliary' },
    { id: 'Apex', name: 'Apex' },
    { id: 'Universal', name: 'Universal' },
    { id: 'Allied', name: 'Allied' },
  ];

  const filteredDetachments =
    selectedType === 'all'
      ? availableDetachments
      : availableDetachments.filter(d => d.type === selectedType);

  const handleDetachmentSelect = (detachment: Detachment) => {
    if (detachment.type === 'Allied') {
      setShowAlliedSelector(true);
    } else {
      onAddDetachment(detachment);
      onClose();
    }
  };

  const handleAlliedFactionSelected = (
    detachment: Detachment,
    faction: Faction,
    subFaction?: Faction
  ) => {
    // Create a copy of the detachment with the selected faction
    const alliedDetachment = {
      ...detachment,
      faction: subFaction ? subFaction.id : faction.id,
    };
    onAddDetachment(alliedDetachment);
    onClose();
  };

  const getDetachmentTypeColor = (type: string): string => {
    switch (type) {
      case 'Auxiliary':
        return '#4caf50';
      case 'Apex':
        return '#ff9800';
      case 'Universal':
        return '#9c27b0';
      case 'Allied':
        return '#2196f3';
      default:
        return '#666';
    }
  };

  const getTriggerDescription = (detachment: Detachment): string => {
    if (!detachment.triggers) return 'Always available';

    const triggers = detachment.triggers.map(trigger => {
      switch (trigger.type) {
        case 'command-filled':
          return 'Command slot filled';
        case 'high-command-filled':
          return 'High Command slot filled';
        case 'always-available':
          return 'Always available';
        default:
          return trigger.description;
      }
    });

    return triggers.join(', ');
  };

  if (showAlliedSelector) {
    return (
      <AlliedFactionSelector
        primaryFactionId={armyList.faction}
        onFactionSelected={handleAlliedFactionSelected}
        onCancel={() => setShowAlliedSelector(false)}
      />
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">
            Add Detachment
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Filter Section */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Filter by type:
            </Typography>
            <ToggleButtonGroup
              value={selectedType}
              exclusive
              onChange={(_, newValue) => newValue && setSelectedType(newValue)}
              size="small"
            >
              {detachmentTypes.map(type => (
                <ToggleButton key={type.id} value={type.id}>
                  {type.name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Detachments List */}
          <Box>
            {filteredDetachments.length === 0 ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
                    No detachments available for the current army list.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Add units to Command or High Command slots to unlock more detachments.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {filteredDetachments.map(detachment => (
                  <Card
                    key={detachment.id}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4 },
                      transition: 'box-shadow 0.2s ease-in-out',
                    }}
                    onClick={() => handleDetachmentSelect(detachment)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3">
                          {detachment.name}
                        </Typography>
                        <Chip
                          label={detachment.type}
                          size="small"
                          sx={{
                            backgroundColor: getDetachmentTypeColor(detachment.type),
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {detachment.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Trigger:
                        </Typography>
                        <Typography variant="body2">
                          {getTriggerDescription(detachment)}
                        </Typography>
                      </Box>

                      {/* Visual Slot Display */}
                      <DetachmentSlots
                        detachment={detachment}
                        armyDetachment={{
                          id: `${detachment.id}-preview`,
                          detachmentId: detachment.id,
                          customName: undefined,
                          points: 0,
                          baseSlots: detachment.slots,
                          modifiedSlots: detachment.slots,
                          primeAdvantages: [],
                          units: [],
                        }}
                        armyList={armyList}
                        onUnitSelected={() => {}} // No-op for display only
                      />
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default AddDetachmentModal;

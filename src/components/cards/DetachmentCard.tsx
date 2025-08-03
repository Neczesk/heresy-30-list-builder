import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import { FolderOpen, Save, Delete } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import DetachmentSlots from '../../pages/listBuilder/DetachmentSlots';
import type { ArmyDetachment, Army } from '../../types/army';

interface DetachmentCardProps {
  armyDetachment: ArmyDetachment;
  armyList: Army;
  index: number;
  onLoadCustomDetachment: (armyDetachment: ArmyDetachment) => void;
  onSaveCustomDetachment: (armyDetachment: ArmyDetachment) => void;
  onRemoveDetachment: (detachmentId: string) => void;
  onUnitSelected: (
    detachmentId: string,
    slotId: string,
    unitId: string,
    detachmentPromptInfo?: { roleId: string; slotIndex: number }
  ) => void;
  onDetachmentPrompt: (roleId: string, slotIndex: number, detachmentId?: string) => void;
  onUnitManagementOpen: (
    unit: any,
    slotId: string,
    detachmentId: string
  ) => void;
  onUnitSelectionOpen: (
    roleId: string,
    roleName: string,
    detachmentId: string,
    slotId: string,
    detachment: any
  ) => void;
}

const DetachmentCard: React.FC<DetachmentCardProps> = ({
  armyDetachment,
  armyList,
  index,
  onLoadCustomDetachment,
  onSaveCustomDetachment,
  onRemoveDetachment,
  onUnitSelected,
  onDetachmentPrompt,
  onUnitManagementOpen,
  onUnitSelectionOpen,
}) => {
  const detachment = DataLoader.getDetachmentById(armyDetachment.detachmentId);

  if (!detachment) return null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" component="h3" gutterBottom>
              {detachment.name}
              {armyDetachment.triggeredBy && (
                <Chip
                  label="Triggered"
                  color="warning"
                  size="small"
                  sx={{ ml: 1, fontSize: '0.75rem' }}
                />
              )}
            </Typography>
            <Chip label={detachment.type} color="secondary" />
            {armyDetachment.triggeredBy && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Triggered by unit in {armyDetachment.triggeredBy.detachmentId}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              color="info"
              size="small"
              onClick={() => onLoadCustomDetachment(armyDetachment)}
              title="Load Custom Detachment"
            >
              <FolderOpen />
            </IconButton>
            <IconButton
              color="success"
              size="small"
              onClick={() => onSaveCustomDetachment(armyDetachment)}
              title="Save as Custom Detachment"
            >
              <Save />
            </IconButton>
            {index > 0 && armyDetachment.detachmentId !== 'crusade-primary' && (
              <IconButton
                color="error"
                size="small"
                onClick={() => onRemoveDetachment(armyDetachment.id)}
                title="Remove Detachment"
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          {detachment.description}
        </Typography>

        {/* Visual Slot Display */}
        <DetachmentSlots
          detachment={detachment}
          armyDetachment={armyDetachment}
          armyList={armyList}
          onUnitSelected={onUnitSelected}
          onDetachmentPrompt={onDetachmentPrompt}
          onUnitManagementOpen={onUnitManagementOpen}
          onUnitSelectionOpen={onUnitSelectionOpen}
        />
      </CardContent>
    </Card>
  );
};

export default DetachmentCard;

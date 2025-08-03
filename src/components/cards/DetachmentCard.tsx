import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
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
  onDetachmentPrompt: (
    roleId: string,
    slotIndex: number,
    detachmentId?: string
  ) => void;
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const detachment = DataLoader.getDetachmentById(armyDetachment.detachmentId);

  if (!detachment) return null;

  return (
    <Card
      sx={{
        width: { xs: '100%', sm: 'auto' },
        maxWidth: { xs: '100%', sm: 'none' },
        // Remove card styling on mobile
        boxShadow: { xs: 'none', sm: 1 },
        border: { xs: 'none', sm: '1px solid' },
        borderColor: { xs: 'transparent', sm: 'divider' },
        borderRadius: { xs: 0, sm: 1 },
        mx: { xs: -2, sm: 0 }, // Negative margin to extend to screen edges
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 3 },
          // Add left padding on mobile for content spacing
          pl: { xs: 3, sm: 3 },
          pr: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: { xs: 1.5, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h3"
              gutterBottom
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.5rem' },
              }}
            >
              {detachment.name}
              {armyDetachment.triggeredBy && (
                <Chip
                  label="Triggered"
                  color="warning"
                  size="small"
                  sx={{
                    ml: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.75rem' },
                  }}
                />
              )}
            </Typography>
            <Chip
              label={detachment.type}
              color="secondary"
              size={isMobile ? 'small' : 'medium'}
            />
            {armyDetachment.triggeredBy && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mt: { xs: 0.5, sm: 0.5 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Triggered by unit in {armyDetachment.triggeredBy.detachmentId}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              alignSelf: { xs: 'flex-start', sm: 'flex-start' },
            }}
          >
            <IconButton
              color="info"
              size={isMobile ? 'small' : 'small'}
              onClick={() => onLoadCustomDetachment(armyDetachment)}
              title="Load Custom Detachment"
              sx={{
                p: { xs: 0.5, sm: 0.5 },
              }}
            >
              <FolderOpen />
            </IconButton>
            <IconButton
              color="success"
              size={isMobile ? 'small' : 'small'}
              onClick={() => onSaveCustomDetachment(armyDetachment)}
              title="Save as Custom Detachment"
              sx={{
                p: { xs: 0.5, sm: 0.5 },
              }}
            >
              <Save />
            </IconButton>
            {index > 0 && armyDetachment.detachmentId !== 'crusade-primary' && (
              <IconButton
                color="error"
                size={isMobile ? 'small' : 'small'}
                onClick={() => onRemoveDetachment(armyDetachment.id)}
                title="Remove Detachment"
                sx={{
                  p: { xs: 0.5, sm: 0.5 },
                }}
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          paragraph
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
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

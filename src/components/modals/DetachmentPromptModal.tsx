import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import type { Detachment, Army } from '../../types/army';

interface DetachmentPromptModalProps {
  isOpen: boolean;
  roleId: string;
  slotIndex: number;
  armyList: Army;
  triggeringDetachmentId: string; // Add the detachment ID where the unit was added
  onClose: () => void;
  onDetachmentSelected: (detachment: Detachment) => void;
}

const DetachmentPromptModal: React.FC<DetachmentPromptModalProps> = ({
  isOpen,
  roleId,
  slotIndex,
  armyList,
  triggeringDetachmentId,
  onClose,
  onDetachmentSelected,
}) => {
  const getAvailableDetachments = () => {
    const allDetachments = DataLoader.getDetachments();
    const primaryFaction = armyList.faction;

    // Get current faction data to check if it's a Legion subfaction
    const currentFactionData = DataLoader.getFactionById(primaryFaction);
    const isLegionSubfaction =
      currentFactionData?.parentFaction === 'legiones-astartes';

    // Get the triggering unit data from the correct detachment
    const triggeringDetachment = armyList.detachments.find(
      d => d.id === triggeringDetachmentId
    );
    const triggeringSlotId = triggeringDetachment
      ? `${triggeringDetachment.id}-${roleId}-${slotIndex}`
      : '';
    const triggeringUnit = triggeringDetachment?.units.find(
      unit => unit.slotId === triggeringSlotId
    );
    const triggeringUnitData = triggeringUnit
      ? DataLoader.getUnitById(triggeringUnit.unitId)
      : null;

    return allDetachments.filter(detachment => {
      // Check if detachment is available based on role filled
      if (roleId === 'command') {
        // Command slots can trigger Auxiliary detachments
        if (detachment.type !== 'Auxiliary') return false;
      } else if (roleId === 'high-command') {
        // High Command slots can trigger Apex or Auxiliary detachments
        if (detachment.type !== 'Apex' && detachment.type !== 'Auxiliary')
          return false;
      } else {
        return false;
      }

      // Check if this detachment has triggers and if they match
      if (detachment.triggers && detachment.triggers.length > 0) {
        let hasMatchingTrigger = false;

        for (const trigger of detachment.triggers) {
          if (trigger.type === 'command-filled' && (roleId === 'command' || roleId === 'high-command')) {
            hasMatchingTrigger = true;
            break;
          } else if (trigger.type === 'high-command-filled' && roleId === 'high-command') {
            hasMatchingTrigger = true;
            break;
          } else if (trigger.type === 'specific-unit') {
            // For specific-unit triggers, we need to check both the unit ID and slot type
            let unitMatches = true;
            let slotMatches = true;

            // Check if the triggering unit matches the required unit
            if (trigger.requiredUnitId && triggeringUnitData) {
              unitMatches = trigger.requiredUnitId === triggeringUnitData.id;
            }

            // Check if the slot type matches
            if (trigger.requiredSlotType) {
              const expectedRoleId =
                trigger.requiredSlotType === 'Command'
                  ? 'command'
                  : 'high-command';
              // High command units can trigger both high command and command detachments
              slotMatches = expectedRoleId === roleId ||
                           (roleId === 'high-command' && expectedRoleId === 'command');
            }

            // Both unit and slot must match for specific-unit triggers
            if (unitMatches && slotMatches) {
              hasMatchingTrigger = true;
              break;
            }
          } else if (trigger.type === 'always-available') {
            hasMatchingTrigger = true;
            break;
          }
        }

        // If the detachment has triggers but none match, exclude it
        if (!hasMatchingTrigger) {
          return false;
        }
      }

      // Special handling for detachments with specific unit triggers
      // These must have their specific unit requirements met, regardless of faction
      if (detachment.triggers && detachment.triggers.some(t => t.type === 'specific-unit')) {
        const specificUnitTrigger = detachment.triggers.find(t => t.type === 'specific-unit');
        if (specificUnitTrigger) {
          // If we have a specific unit requirement but no triggering unit data, exclude the detachment
          if (specificUnitTrigger.requiredUnitId && !triggeringUnitData) {
            return false;
          }

          // Check if the triggering unit matches the required unit
          if (specificUnitTrigger.requiredUnitId && triggeringUnitData) {
            if (specificUnitTrigger.requiredUnitId !== triggeringUnitData.id) {
              return false;
            }
          }

          // Check if the slot type matches
          if (specificUnitTrigger.requiredSlotType) {
            const expectedRoleId =
              specificUnitTrigger.requiredSlotType === 'Command'
                ? 'command'
                : 'high-command';
            // High command units can trigger both high command and command detachments
            const slotMatches = expectedRoleId === roleId ||
                               (roleId === 'high-command' && expectedRoleId === 'command');
            if (!slotMatches) {
              return false;
            }
          }
        }
      }

      // Check faction compatibility
      if (detachment.faction && detachment.faction !== 'universal') {
        // Direct faction match
        if (detachment.faction === primaryFaction) {
          return true;
        }

        // Check if current faction is a subfaction of the detachment's faction
        if (currentFactionData?.parentFaction === detachment.faction) {
          return true;
        }

        // For Legion subfactions, allow detachments marked for legiones-astartes
        if (isLegionSubfaction && detachment.faction === 'legiones-astartes') {
          return true;
        }

        // Check if the detachment faction matches the triggering unit's faction
        if (triggeringUnitData && triggeringUnitData.faction === detachment.faction) {
          return true;
        }

        return false;
      }

      // Check requirements
      if (detachment.requirements && detachment.requirements.length > 0) {
        for (const requirement of detachment.requirements) {
          if (requirement.type === 'detachment') {
            if (requirement.value === 'primary') {
              // Check if we have a primary detachment
              const hasPrimaryDetachment = armyList.detachments.some(d => {
                const detachmentData = DataLoader.getDetachmentById(d.detachmentId);
                return detachmentData?.type === 'Primary';
              });
              if (!hasPrimaryDetachment) {
                return false;
              }
            }
          } else if (requirement.type === 'faction') {
            if (requirement.value === 'any') {
              // This requirement is always met for faction selection
              continue;
            }
          }
        }
      }

      // Check restrictions
      if (detachment.restrictions && detachment.restrictions.length > 0) {
        for (const restriction of detachment.restrictions) {
          if (restriction.type === 'faction-must-match') {
            if (restriction.value === 'primary-faction' && detachment.faction !== primaryFaction) {
              return false;
            }
          } else if (restriction.type === 'faction-must-differ') {
            if (restriction.value === 'primary-faction' && detachment.faction === primaryFaction) {
              return false;
            }
          } else if (restriction.type === 'max-count') {
            // Check if we already have the maximum number of this detachment type
            const currentCount = armyList.detachments.filter(d => d.detachmentId === detachment.id).length;
            const maxCount = typeof restriction.value === 'number' ? restriction.value : parseInt(restriction.value as string, 10);
            if (currentCount >= maxCount) {
              return false;
            }
          }
        }
      }

      return true;
    });
  };

  const availableDetachments = getAvailableDetachments();
  const roleName = DataLoader.getBattlefieldRoleById(roleId)?.name || 'Command';
  const triggerType =
    roleId === 'high-command' ? 'Apex or Auxiliary' : 'Auxiliary';

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h3">
            Add {triggerType} Detachment
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <Typography variant="body1" color="text.secondary">
            You've filled a {roleName} slot! You can now add a{' '}
            {triggerType.toLowerCase()} detachment to your force.
          </Typography>

          {availableDetachments.length > 0 ? (
            <Stack spacing={2}>
              {availableDetachments.map(detachment => (
                <Card
                  key={detachment.id}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s ease-in-out',
                  }}
                  onClick={() => {
                    onDetachmentSelected(detachment);
                    onClose();
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3">
                        {detachment.name}
                      </Typography>
                      <Chip
                        label={detachment.type}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {detachment.description}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {detachment.slots.map((slot, index) => (
                        <Chip
                          key={index}
                          label={`${slot.count}x ${DataLoader.getBattlefieldRoleById(slot.roleId)?.name}${slot.isPrime ? ' ★' : ''}`}
                          size="small"
                          variant="outlined"
                          color={slot.isPrime ? "warning" : "default"}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center">
                  No {triggerType.toLowerCase()} detachments available for your faction.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Skip for now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetachmentPromptModal;

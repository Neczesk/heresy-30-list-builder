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
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

    // Debug: Check what Apex detachments exist
    const apexDetachments = allDetachments.filter(d => d.type === 'Apex');
    console.log('=== Apex Detachment Debug ===');
    console.log('Role ID:', roleId);
    console.log('Apex detachments found:', apexDetachments.length);
    apexDetachments.forEach(d => {
      console.log(
        `- ${d.name}: triggers=${d.triggers?.map(t => t.type).join(', ')}`
      );
    });

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
        console.log(
          `  Checking triggers for ${detachment.name}: ${detachment.triggers.map(t => t.type).join(', ')}`
        );
        let hasMatchingTrigger = false;

        for (const trigger of detachment.triggers) {
          if (
            trigger.type === 'command-filled' &&
            (roleId === 'command' || roleId === 'high-command')
          ) {
            console.log(`    ✅ command-filled trigger matched`);
            hasMatchingTrigger = true;
            break;
          } else if (
            trigger.type === 'high-command-filled' &&
            roleId === 'high-command'
          ) {
            console.log(`    ✅ high-command-filled trigger matched`);
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
              slotMatches =
                expectedRoleId === roleId ||
                (roleId === 'high-command' && expectedRoleId === 'command');
            }

            // Both unit and slot must match for specific-unit triggers
            if (unitMatches && slotMatches) {
              console.log(`    ✅ specific-unit trigger matched`);
              hasMatchingTrigger = true;
              break;
            }
          } else if (trigger.type === 'always-available') {
            console.log(`    ✅ always-available trigger matched`);
            hasMatchingTrigger = true;
            break;
          }
        }

        // If the detachment has triggers but none match, exclude it
        if (!hasMatchingTrigger) {
          console.log(`    ❌ No matching triggers found`);
          return false;
        }
      } else {
        console.log(`  No triggers required for ${detachment.name}`);
      }

      // Special handling for detachments with specific unit triggers
      // These must have their specific unit requirements met, regardless of faction
      if (
        detachment.triggers &&
        detachment.triggers.some(t => t.type === 'specific-unit')
      ) {
        const specificUnitTrigger = detachment.triggers.find(
          t => t.type === 'specific-unit'
        );
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
            const slotMatches =
              expectedRoleId === roleId ||
              (roleId === 'high-command' && expectedRoleId === 'command');
            if (!slotMatches) {
              return false;
            }
          }
        }
      }

      // Check faction compatibility
      // If universal faction, allow it
      if (detachment.faction.includes('universal')) {
        // Universal detachments are always available
      } else {
        // Check if any of the detachment's factions match
        let hasMatchingFaction = false;

        for (const faction of detachment.faction) {
          // Direct faction match
          if (faction === primaryFaction) {
            hasMatchingFaction = true;
            break;
          }

          // Check if current faction is a subfaction of the detachment's faction
          if (currentFactionData?.parentFaction === faction) {
            hasMatchingFaction = true;
            break;
          }

          // For Legion subfactions, allow detachments marked for legiones-astartes
          if (isLegionSubfaction && faction === 'legiones-astartes') {
            hasMatchingFaction = true;
            break;
          }

          // Check if the detachment faction matches the triggering unit's faction
          if (triggeringUnitData && triggeringUnitData.faction === faction) {
            hasMatchingFaction = true;
            break;
          }
        }

        if (!hasMatchingFaction) {
          return false;
        }
      }

      // Check requirements
      if (detachment.requirements && detachment.requirements.length > 0) {
        for (const requirement of detachment.requirements) {
          if (requirement.type === 'detachment') {
            if (requirement.value === 'primary') {
              // Check if we have a primary detachment
              const hasPrimaryDetachment = armyList.detachments.some(d => {
                const detachmentData = DataLoader.getDetachmentById(
                  d.detachmentId
                );
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
            if (
              restriction.value === 'primary-faction' &&
              !detachment.faction.includes(primaryFaction)
            ) {
              return false;
            }
          } else if (restriction.type === 'faction-must-differ') {
            if (
              restriction.value === 'primary-faction' &&
              detachment.faction.includes(primaryFaction)
            ) {
              return false;
            }
          } else if (restriction.type === 'max-count') {
            // Check if we already have the maximum number of this detachment type
            const currentCount = armyList.detachments.filter(
              d => d.detachmentId === detachment.id
            ).length;
            const maxCount =
              typeof restriction.value === 'number'
                ? restriction.value
                : parseInt(restriction.value as string, 10);
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
  console.log(`\n=== Final Result ===`);
  console.log(`Available detachments: ${availableDetachments.length}`);
  console.log(
    `Available detachment names: ${availableDetachments.map(d => d.name).join(', ')}`
  );
  console.log(`=== End Debug ===\n`);

  const roleName = DataLoader.getBattlefieldRoleById(roleId)?.name || 'Command';
  const triggerType =
    roleId === 'high-command' ? 'Apex or Auxiliary' : 'Auxiliary';

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: isMobile ? '100vh' : '90vh',
          height: isMobile ? '100vh' : 'auto',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: { xs: 2, sm: 3 },
          pb: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            component="h3"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.5rem' },
            }}
          >
            Add {triggerType} Detachment
          </Typography>
          <IconButton
            onClick={onClose}
            size={isMobile ? 'medium' : 'small'}
            sx={{
              p: { xs: 1, sm: 0.5 },
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 0, sm: 1 },
        }}
      >
        <Stack spacing={{ xs: 2, sm: 3 }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            You've filled a {roleName} slot! You can now add a{' '}
            {triggerType.toLowerCase()} detachment to your force.
          </Typography>

          {availableDetachments.length > 0 ? (
            <Stack spacing={{ xs: 1.5, sm: 2 }}>
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
                  <CardContent
                    sx={{
                      p: { xs: 2, sm: 3 },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 1, sm: 0 },
                      }}
                    >
                      <Typography
                        variant={isMobile ? 'h6' : 'h6'}
                        component="h3"
                        sx={{
                          fontSize: { xs: '1.125rem', sm: '1.25rem' },
                        }}
                      >
                        {detachment.name}
                      </Typography>
                      <Chip
                        label={detachment.type}
                        size={isMobile ? 'small' : 'small'}
                        color="primary"
                        variant="outlined"
                        sx={{
                          alignSelf: { xs: 'flex-start', sm: 'flex-end' },
                        }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      {detachment.description}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        justifyContent: { xs: 'flex-start', sm: 'flex-start' },
                      }}
                    >
                      {detachment.slots.map((slot, index) => (
                        <Chip
                          key={index}
                          label={`${slot.count}x ${DataLoader.getBattlefieldRoleById(slot.roleId)?.name}${slot.isPrime ? ' ★' : ''}`}
                          size={isMobile ? 'small' : 'small'}
                          variant="outlined"
                          color={slot.isPrime ? 'warning' : 'default'}
                          sx={{
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Card variant="outlined">
              <CardContent
                sx={{
                  p: { xs: 2, sm: 3 },
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  No {triggerType.toLowerCase()} detachments available for your
                  faction.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 0, sm: 1 },
        }}
      >
        <Button
          onClick={onClose}
          size={isMobile ? 'large' : 'medium'}
          sx={{
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          Skip for now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetachmentPromptModal;

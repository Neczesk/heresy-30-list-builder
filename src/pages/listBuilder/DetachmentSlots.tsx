import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Tooltip,
} from '@mui/material';
import { Star, FlashOn, Settings, Close } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import UnitRemoveConfirmationModal from '../../components/modals/UnitRemoveConfirmationModal';
import type { Detachment, ArmyDetachment, ArmyUnit, Army } from '../../types/army';

interface DetachmentSlotsProps {
  detachment: Detachment;
  armyDetachment: ArmyDetachment;
  armyList: Army;
  onUnitSelected: (
    detachmentId: string,
    slotId: string,
    unitId: string
  ) => void;
  onDetachmentPrompt?: (roleId: string, slotIndex: number, detachmentId?: string) => void;
  onUnitUpdated?: (slotId: string, updatedUnit: ArmyUnit) => void;
  onDetachmentRemoved?: (detachmentId: string) => void;
  onUnitManagementOpen?: (
    unit: ArmyUnit,
    slotId: string,
    detachmentId: string
  ) => void;
  onUnitSelectionOpen?: (
    roleId: string,
    roleName: string,
    detachmentId: string,
    slotId: string,
    detachment: any
  ) => void;
}

interface SlotGroup {
  roleId: string;
  roleName: string;
  slots: Array<{
    roleId: string;
    count: number;
    isPrime: boolean;
    description?: string;
    allowedUnits?: string[]; // Unit IDs that can be placed in this slot
    slotIndex: number; // Added for correct global slot index
    isCustomSlot: boolean; // Added to distinguish custom slots
  }>;
}

const DetachmentSlots: React.FC<DetachmentSlotsProps> = ({
  detachment,
  armyDetachment,
  armyList,
  onUnitSelected,
  onUnitManagementOpen,
  onUnitSelectionOpen,
}) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [unitToRemove, setUnitToRemove] = useState<{
    slotId: string;
    unitName: string;
  } | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const getRoleIcon = (roleId: string): string => {
    switch (roleId) {
      case 'high-command':
        return '👑'; // Crown for High Command
      case 'command':
        return '⚔️'; // Crossed swords for Command
      case 'troops':
        return '👥'; // People for Troops
      case 'transport':
        return '🚗'; // Car for Transport
      case 'heavy-transport':
        return '🚛'; // Truck for Heavy Transport
      case 'support':
        return '🎯'; // Target for Support
      case 'armour':
        return '🛡️'; // Shield for Armour
      case 'war-engine':
        return '🤖'; // Robot for War Engine
      case 'elite':
        return '💀'; // Crown for Elite
      case 'reconnaissance':
        return '🔍'; // Magnifying glass for Reconnaissance
      case 'heavy-assault':
        return '💥'; // Explosion for Heavy Assault
      case 'fast-attack':
        return '⚡'; // Lightning for Fast Attack
      case 'retinue':
        return '👤'; // Person for Retinue
      case 'warlord':
        return '👑'; // Crown for Warlord
      case 'lord-of-war':
        return '☢️'; // Crown for Lord of War
      default:
        return '❓'; // Question mark for unknown
    }
  };

  const getUnitInSlot = (roleId: string, slotIndex: number) => {
    const slotId = `${armyDetachment.id}-${roleId}-${slotIndex}`;
    return armyDetachment.units.find(unit => unit.slotId === slotId);
  };

  const hasTriggeredDetachment = (roleId: string, slotIndex: number) => {
    // Construct the slot ID using the current detachment's ID
    const slotId = `${armyDetachment.id}-${roleId}-${slotIndex}`;

    // Check if any detachment in the army list was triggered by this slot
    return armyList.detachments.some(
      detachment =>
        detachment.triggeredBy &&
        detachment.triggeredBy.slotId === slotId &&
        detachment.triggeredBy.detachmentId === armyDetachment.id
    );
  };

  const getTriggeredDetachments = (roleId: string, slotIndex: number) => {
    // Construct the slot ID using the current detachment's ID
    const slotId = `${armyDetachment.id}-${roleId}-${slotIndex}`;

    // Get all detachments triggered by this slot
    return armyList.detachments.filter(
      detachment =>
        detachment.triggeredBy &&
        detachment.triggeredBy.slotId === slotId &&
        detachment.triggeredBy.detachmentId === armyDetachment.id
    );
  };

  const handleSlotClick = (roleId: string, slotIndex: number) => {
    const slotId = `${armyDetachment.id}-${roleId}-${slotIndex}`;
    const unitInSlot = getUnitInSlot(roleId, slotIndex);
    const isFilled = !!unitInSlot;

    if (isFilled) {
      // If filled, open unit management modal via callback
      if (onUnitManagementOpen && unitInSlot) {
        onUnitManagementOpen(unitInSlot, slotId, armyDetachment.id);
      }
    } else {
      // If empty, show unit selection modal via callback
      if (onUnitSelectionOpen) {
        const roleName =
          DataLoader.getBattlefieldRoleById(roleId)?.name || 'Unknown';
        onUnitSelectionOpen(
          roleId,
          roleName,
          armyDetachment.id,
          slotId,
          detachment
        );
      }
    }
  };

  const handleRemoveUnit = (roleId: string, slotIndex: number) => {
    const slotId = `${armyDetachment.id}-${roleId}-${slotIndex}`;
    const unitInSlot = getUnitInSlot(roleId, slotIndex);

    if (unitInSlot) {
      const unitData = DataLoader.getUnitById(unitInSlot.unitId);
      const unitName = unitData?.name || unitInSlot.unitId;

      setUnitToRemove({ slotId, unitName });
      setShowRemoveConfirm(true);
    }
  };

  const handleConfirmRemove = () => {
    if (unitToRemove) {
      onUnitSelected(armyDetachment.id, unitToRemove.slotId, ''); // Empty string indicates removal
      setShowRemoveConfirm(false);
      setUnitToRemove(null);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false);
    setUnitToRemove(null);
  };

  // Removed getAvailableUnits function since filtering is now handled in UnitSelectionModal

  const renderSlot = (slot: any) => {
    const role = DataLoader.getBattlefieldRoleById(slot.roleId);
    const unitInSlot = getUnitInSlot(slot.roleId, slot.slotIndex);
    const isFilled = !!unitInSlot;
    const hasTriggered = hasTriggeredDetachment(slot.roleId, slot.slotIndex);
    const triggeredDetachments = getTriggeredDetachments(slot.roleId, slot.slotIndex);
    const isCustomSlot = slot.isCustomSlot;

    // Get unit name for tooltip if filled
    let unitName = '';
    let customSlotInfo = '';
    if (isFilled && unitInSlot) {
      const unitData = DataLoader.getUnitById(unitInSlot.unitId);
      unitName = unitData?.name || unitInSlot.unitId;

      // Check if this unit has logistical-benefit prime advantage
      if (
        unitInSlot.primeAdvantages?.some(
          pa => pa.advantageId === 'logistical-benefit'
        )
      ) {
        customSlotInfo = ' - Added by Logistical Benefit';
      }
    }

    const tooltipText = isFilled
      ? `${unitName}${slot.isPrime ? ' (Prime)' : ''}${hasTriggered ? ` - Has triggered ${triggeredDetachments.length} detachment${triggeredDetachments.length > 1 ? 's' : ''}` : ''}${customSlotInfo} - Click to remove`
      : `${role?.name}${slot.isPrime ? ' (Prime)' : ''}${isCustomSlot ? ' - Custom slot' : ''} - Click to add unit`;

    return (
      <Tooltip key={`${slot.roleId}-${slot.slotIndex}`} title={tooltipText} arrow>
        <Box
          sx={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: slot.isPrime ? '3px solid' : '2px solid',
            borderColor: isFilled
              ? hasTriggered
                ? 'warning.main'
                : 'success.main'
              : slot.isPrime
              ? '#ffd700'
              : 'rgba(255, 255, 255, 0.3)',
            backgroundColor: isFilled
              ? hasTriggered
                ? 'rgba(255, 152, 0, 0.3)'
                : 'rgba(76, 175, 80, 0.3)'
              : slot.isPrime
              ? 'rgba(255, 215, 0, 0.1)'
              : 'rgba(255, 255, 255, 0.05)',
            boxShadow: isFilled
              ? hasTriggered
                ? '0 0 12px rgba(255, 152, 0, 0.4)'
                : '0 0 12px rgba(76, 175, 80, 0.4)'
              : slot.isPrime
              ? '0 0 8px rgba(255, 215, 0, 0.3)'
              : 'none',
            transform: isFilled ? 'scale(1.05)' : 'scale(1)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            },
          }}
          onClick={() => handleSlotClick(slot.roleId, slot.slotIndex)}
          onMouseEnter={() => setHoveredSlot(`${slot.roleId}-${slot.slotIndex}`)}
          onMouseLeave={() => setHoveredSlot(null)}
        >
          <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>
            {getRoleIcon(slot.roleId)}
          </Typography>

          {/* Prime indicator */}
          {slot.isPrime && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                color: '#ffd700',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <Star sx={{ fontSize: '0.75rem' }} />
            </Box>
          )}

          {/* Custom indicator */}
          {isCustomSlot && (
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                left: -2,
                color: 'warning.main',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <Settings sx={{ fontSize: '0.75rem' }} />
            </Box>
          )}

          {/* Filled indicator */}
          {isFilled && (
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                right: slot.isPrime ? 12 : -2,
                color: 'success.main',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <Typography sx={{ fontSize: '0.5rem', color: 'white', fontWeight: 600 }}>
                {unitName.split(' ')[0]}
              </Typography>
            </Box>
          )}

          {/* Triggered indicator */}
          {hasTriggered && (
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                left: isCustomSlot ? 12 : -2,
                color: 'warning.main',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              {triggeredDetachments.length > 1 ? (
                <Typography sx={{ fontSize: '0.5rem', color: 'white', fontWeight: 600 }}>
                  {triggeredDetachments.length}
                </Typography>
              ) : (
                <FlashOn sx={{ fontSize: '0.75rem' }} />
              )}
            </Box>
          )}

          {/* Remove button */}
          {hoveredSlot === `${slot.roleId}-${slot.slotIndex}` && isFilled && (
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: 'error.main',
                color: 'white',
                width: 20,
                height: 20,
                opacity: 1,
                transform: 'scale(1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#d32f2f',
                  transform: 'scale(1.1)',
                },
              }}
              onClick={e => {
                e.stopPropagation();
                handleRemoveUnit(slot.roleId, slot.slotIndex);
              }}
            >
              <Close sx={{ fontSize: '0.75rem' }} />
            </IconButton>
          )}
        </Box>
      </Tooltip>
    );
  };

  // Group slots by role type for row display
  const groupedSlots: SlotGroup[] = [];

  // Track total slot index across all roles
  let globalSlotIndex = 0;

  // Use modifiedSlots as the source of truth (includes any modifications from prime advantages)
  // If modifiedSlots is empty, fall back to the base detachment slots
  const slotsToProcess =
    armyDetachment.modifiedSlots.length > 0
      ? armyDetachment.modifiedSlots
      : detachment.slots;

  // Process all slots
  slotsToProcess.forEach(slot => {
    const existing = groupedSlots.find(g => g.roleId === slot.roleId);
    if (existing) {
      // Add multiple slots of the same type
      for (let i = 0; i < slot.count; i++) {
        existing.slots.push({
          ...slot,
          count: 1,
          slotIndex: globalSlotIndex,
          isCustomSlot: false, // All slots are treated as base slots since we're using modifiedSlots as source
        });
        globalSlotIndex++;
      }
    } else {
      const newGroup: SlotGroup = {
        roleId: slot.roleId,
        roleName:
          DataLoader.getBattlefieldRoleById(slot.roleId)?.name || 'Unknown',
        slots: [],
      };
      // Add multiple slots of the same type
      for (let i = 0; i < slot.count; i++) {
        newGroup.slots.push({
          ...slot,
          count: 1,
          slotIndex: globalSlotIndex,
          isCustomSlot: false, // All slots are treated as base slots since we're using modifiedSlots as source
        });
        globalSlotIndex++;
      }
      groupedSlots.push(newGroup);
    }
  });

  return (
    <Box sx={{ mt: 3 }}>
      {/* Slots Rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {groupedSlots.map((group, groupIndex) => (
          <Paper
            key={groupIndex}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              p: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography
              sx={{
                minWidth: 120,
                fontWeight: 600,
                color: 'primary.main',
                fontSize: '1rem',
                textTransform: 'capitalize',
              }}
            >
              {group.roleName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {group.slots.map(slot => renderSlot(slot))}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Slots Legend */}
      <Paper
        sx={{
          display: 'flex',
          gap: 3,
          mt: 3,
          p: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Empty Slot */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <Typography sx={{ fontSize: '1rem' }}>⚔️</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Empty Slot
          </Typography>
        </Box>

        {/* Filled Slot */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              position: 'relative',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid',
              borderColor: 'success.main',
              backgroundColor: 'rgba(76, 175, 80, 0.3)',
              transform: 'scale(1.05)',
            }}
          >
            <Typography sx={{ fontSize: '1rem' }}>⚔️</Typography>
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                color: 'success.main',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <Typography sx={{ fontSize: '0.5rem', color: 'white', fontWeight: 600 }}>
                UNIT
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Filled Slot
          </Typography>
        </Box>

        {/* Prime Slot */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              position: 'relative',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #ffd700',
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
            }}
          >
            <Typography sx={{ fontSize: '1rem' }}>⚔️</Typography>
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                color: '#ffd700',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <Star sx={{ fontSize: '0.75rem' }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Prime Slot
          </Typography>
        </Box>

        {/* Triggered Detachment */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              position: 'relative',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid',
              borderColor: 'warning.main',
              backgroundColor: 'rgba(255, 152, 0, 0.3)',
              transform: 'scale(1.05)',
            }}
          >
            <Typography sx={{ fontSize: '1rem' }}>⚔️</Typography>
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                color: 'success.main',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <Typography sx={{ fontSize: '0.5rem', color: 'white', fontWeight: 600 }}>
                UNIT
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                left: -2,
                color: 'warning.main',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <FlashOn sx={{ fontSize: '0.75rem' }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Triggered Detachment
          </Typography>
        </Box>
      </Paper>

      {/* Remove Confirmation Modal */}
      <UnitRemoveConfirmationModal
        isOpen={showRemoveConfirm}
        unitName={unitToRemove?.unitName || ''}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </Box>
  );
};

export default DetachmentSlots;

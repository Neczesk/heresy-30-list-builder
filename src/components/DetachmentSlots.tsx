import React, { useState } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import UnitSelectionModal from './UnitSelectionModal';
import type { Detachment, ArmyDetachment, Army, ArmyUnit } from '../types/army';

import './DetachmentSlots.css';

interface DetachmentSlotsProps {
  detachment: Detachment;
  armyDetachment: ArmyDetachment;
  armyList: Army;
  onUnitSelected: (detachmentId: string, slotId: string, unitId: string) => void;
  onDetachmentPrompt?: (roleId: string, slotIndex: number) => void;
  onUnitUpdated?: (slotId: string, updatedUnit: ArmyUnit) => void;
  onDetachmentRemoved?: (detachmentId: string) => void;
  onUnitManagementOpen?: (unit: ArmyUnit, slotId: string, detachmentId: string) => void;
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
  onDetachmentPrompt,
  onUnitManagementOpen
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{
    roleId: string;
    slotIndex: number;
  } | null>(null);
  const [showUnitModal, setShowUnitModal] = useState(false);
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
    const slotId = `${detachment.id}-${roleId}-${slotIndex}`;
    return armyDetachment.units.find(unit => unit.slotId === slotId);
  };

  const hasTriggeredDetachment = (roleId: string, slotIndex: number) => {
    // Construct the slot ID using the current detachment's ID
    const slotId = `${detachment.id}-${roleId}-${slotIndex}`;
    
    // Check if any detachment in the army list was triggered by this slot
    return armyList.detachments.some(detachment => 
      detachment.triggeredBy && detachment.triggeredBy.slotId === slotId
    );
  };

  const handleSlotClick = (roleId: string, slotIndex: number) => {
    const slotId = `${detachment.id}-${roleId}-${slotIndex}`;
    const unitInSlot = getUnitInSlot(roleId, slotIndex);
    const isFilled = !!unitInSlot;
    
    if (isFilled) {
      // If filled, open unit management modal via callback
      if (onUnitManagementOpen && unitInSlot) {
        onUnitManagementOpen(unitInSlot, slotId, detachment.id);
      }
    } else {
      // If empty, show unit selection modal
      setSelectedSlot({ roleId, slotIndex });
      setShowUnitModal(true);
    }
  };

  const handleRemoveUnit = (roleId: string, slotIndex: number) => {
    const slotId = `${detachment.id}-${roleId}-${slotIndex}`;
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
      onUnitSelected(detachment.id, unitToRemove.slotId, ''); // Empty string indicates removal
      setShowRemoveConfirm(false);
      setUnitToRemove(null);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false);
    setUnitToRemove(null);
  };

  const handleUnitSelect = (unitId: string) => {
    if (selectedSlot) {
      const slotId = `${detachment.id}-${selectedSlot.roleId}-${selectedSlot.slotIndex}`;
      onUnitSelected(detachment.id, slotId, unitId);
      setShowUnitModal(false);
      setSelectedSlot(null);
      
      // Check if this is a command or high command slot that was just filled
      if ((selectedSlot.roleId === 'command' || selectedSlot.roleId === 'high-command') && onDetachmentPrompt) {
        // Small delay to ensure the unit is added first
        setTimeout(() => {
          onDetachmentPrompt(selectedSlot.roleId, selectedSlot.slotIndex);
        }, 100);
      }
    }
  };

  const handleCloseModal = () => {
    setShowUnitModal(false);
    setSelectedSlot(null);
  };

  // Removed getAvailableUnits function since filtering is now handled in UnitSelectionModal

  const renderSlot = (slot: any) => {
    const role = DataLoader.getBattlefieldRoleById(slot.roleId);
    const unitInSlot = getUnitInSlot(slot.roleId, slot.slotIndex);
    const isFilled = !!unitInSlot;
    const hasTriggered = hasTriggeredDetachment(slot.roleId, slot.slotIndex);
    const isCustomSlot = slot.isCustomSlot;
    
    // Get unit name for tooltip if filled
    let unitName = '';
    let customSlotInfo = '';
    if (isFilled && unitInSlot) {
      const unitData = DataLoader.getUnitById(unitInSlot.unitId);
      unitName = unitData?.name || unitInSlot.unitId;
      
      // Check if this unit has logistical-benefit prime advantage
      if (unitInSlot.primeAdvantages?.some(pa => pa.advantageId === 'logistical-benefit')) {
        customSlotInfo = ' - Added by Logistical Benefit';
      }
    }
    
    return (
      <div
        key={`${slot.roleId}-${slot.slotIndex}`}
        className={`slot-circle ${slot.isPrime ? 'prime' : ''} ${isFilled ? 'filled' : 'empty'} ${hasTriggered ? 'has-triggered' : ''} ${isCustomSlot ? 'custom' : ''}`}
        title={isFilled 
          ? `${unitName}${slot.isPrime ? ' (Prime)' : ''}${hasTriggered ? ' - Has triggered detachment' : ''}${customSlotInfo} - Click to remove`
          : `${role?.name}${slot.isPrime ? ' (Prime)' : ''}${isCustomSlot ? ' - Custom slot' : ''} - Click to add unit`
        }
        onClick={() => handleSlotClick(slot.roleId, slot.slotIndex)}
        onMouseEnter={() => setHoveredSlot(`${slot.roleId}-${slot.slotIndex}`)}
        onMouseLeave={() => setHoveredSlot(null)}
      >
        <span className="slot-icon">{getRoleIcon(slot.roleId)}</span>
        {slot.isPrime && <span className="prime-indicator">★</span>}
        {isCustomSlot && <span className="custom-indicator">⚙️</span>}
        {isFilled && (
          <div className="filled-indicator">
            <span className="unit-name-short">{unitName.split(' ')[0]}</span>
          </div>
        )}
        {hasTriggered && (
          <div className="triggered-indicator">
            <span className="triggered-icon">⚡</span>
          </div>
        )}
        {hoveredSlot === `${slot.roleId}-${slot.slotIndex}` && isFilled && (
          <span 
            className="remove-icon" 
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveUnit(slot.roleId, slot.slotIndex);
            }}
          >
            ×
          </span>
        )}
      </div>
    );
  };

  // Group slots by role type for row display
  const groupedSlots: SlotGroup[] = [];
  
  // Track total slot index across all roles
  let globalSlotIndex = 0;
  
  // Use modifiedSlots as the source of truth (includes any modifications from prime advantages)
  // If modifiedSlots is empty, fall back to the base detachment slots
  const slotsToProcess = armyDetachment.modifiedSlots.length > 0 
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
          isCustomSlot: false // All slots are treated as base slots since we're using modifiedSlots as source
        });
        globalSlotIndex++;
      }
    } else {
      const newGroup: SlotGroup = {
        roleId: slot.roleId,
        roleName: DataLoader.getBattlefieldRoleById(slot.roleId)?.name || 'Unknown',
        slots: []
      };
      // Add multiple slots of the same type
      for (let i = 0; i < slot.count; i++) {
        newGroup.slots.push({ 
          ...slot, 
          count: 1, 
          slotIndex: globalSlotIndex,
          isCustomSlot: false // All slots are treated as base slots since we're using modifiedSlots as source
        });
        globalSlotIndex++;
      }
      groupedSlots.push(newGroup);
    }
  });

  // Removed getAvailableUnits() call since we're now using UnitSelectionModal
  const roleName = selectedSlot ? DataLoader.getBattlefieldRoleById(selectedSlot.roleId)?.name || 'Unknown' : 'Unknown';

  return (
    <div className="detachment-slots">
      <div className="slots-rows">
        {groupedSlots.map((group, groupIndex) => (
          <div key={groupIndex} className="slot-row">
            <div className="row-label">{group.roleName}</div>
            <div className="row-slots">
              {group.slots.map((slot) => renderSlot(slot))}
            </div>
          </div>
        ))}
      </div>
      <div className="slots-legend">
        <div className="legend-item">
          <div className="slot-circle empty">
            <span className="slot-icon">⚔️</span>
          </div>
          <span>Empty Slot</span>
        </div>
        <div className="legend-item">
          <div className="slot-circle filled">
            <span className="slot-icon">⚔️</span>
            <div className="filled-indicator">
              <span className="unit-name-short">UNIT</span>
            </div>
          </div>
          <span>Filled Slot</span>
        </div>
        <div className="legend-item">
          <div className="slot-circle prime empty">
            <span className="slot-icon">⚔️</span>
            <span className="prime-indicator">★</span>
          </div>
          <span>Prime Slot</span>
        </div>
        <div className="legend-item">
          <div className="slot-circle has-triggered filled">
            <span className="slot-icon">⚔️</span>
            <div className="filled-indicator">
              <span className="unit-name-short">UNIT</span>
            </div>
            <div className="triggered-indicator">
              <span className="triggered-icon">⚡</span>
            </div>
          </div>
          <span>Triggered Detachment</span>
        </div>
      </div>

      {/* Unit Selection Modal */}
      {showUnitModal && selectedSlot && (
        <UnitSelectionModal
          isOpen={showUnitModal}
          roleId={selectedSlot.roleId}
          roleName={roleName}
          armyList={armyList}
          detachment={detachment}
          onUnitSelected={handleUnitSelect}
          onClose={handleCloseModal}
        />
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && unitToRemove && (
        <div className="confirm-modal-overlay" onClick={() => setShowRemoveConfirm(false)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Unit</h3>
            <p>Are you sure you want to remove "{unitToRemove.unitName}"?</p>
            <div className="confirm-buttons">
              <Button 
                variant="danger"
                onClick={handleConfirmRemove}
              >
                Yes, Remove
              </Button>
              <Button 
                variant="secondary"
                onClick={handleCancelRemove}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetachmentSlots; 
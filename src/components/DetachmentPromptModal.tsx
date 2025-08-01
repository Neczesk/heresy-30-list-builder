import React from 'react';
import { DataLoader } from '../utils/dataLoader';
import type { Detachment, ArmyList } from '../types/army';
import './DetachmentPromptModal.css';

interface DetachmentPromptModalProps {
  isOpen: boolean;
  roleId: string;
  slotIndex: number;
  armyList: ArmyList;
  onClose: () => void;
  onDetachmentSelected: (detachment: Detachment) => void;
}

const DetachmentPromptModal: React.FC<DetachmentPromptModalProps> = ({
  isOpen,
  roleId,
  slotIndex,
  armyList,
  onClose,
  onDetachmentSelected
}) => {
  if (!isOpen) return null;

  const getAvailableDetachments = () => {
    const allDetachments = DataLoader.getDetachments();
    const primaryFaction = armyList.faction;
    
    // Get current faction data to check if it's a Legion subfaction
    const currentFactionData = DataLoader.getFactionById(primaryFaction);
    const isLegionSubfaction = currentFactionData?.parentFaction === 'legiones-astartes';
    
    // Get the triggering unit data
    const triggeringSlotId = `${armyList.detachments[0].detachmentId}-${roleId}-${slotIndex}`;
    const triggeringUnit = armyList.detachments[0].units.find(unit => unit.slotId === triggeringSlotId);
    const triggeringUnitData = triggeringUnit ? DataLoader.getUnitById(triggeringUnit.unitId) : null;
    
    return allDetachments.filter(detachment => {
      // Check if detachment is available based on role filled
      if (roleId === 'command') {
        // Command slots can trigger Auxiliary detachments
        if (detachment.type !== 'Auxiliary') return false;
      } else if (roleId === 'high-command') {
        // High Command slots can trigger Apex or Auxiliary detachments
        if (detachment.type !== 'Apex' && detachment.type !== 'Auxiliary') return false;
      } else {
        return false;
      }

      // Check if this detachment requires a specific unit and if the triggering unit matches
      if (detachment.triggers) {
        for (const trigger of detachment.triggers) {
          if (trigger.type === 'specific-unit') {
            // Check if the triggering unit matches the required unit
            if (trigger.requiredUnitId && triggeringUnitData) {
              if (trigger.requiredUnitId !== triggeringUnitData.id) {
                return false;
              }
            }
            
            // Check if the slot type matches
            if (trigger.requiredSlotType) {
              const expectedRoleId = trigger.requiredSlotType === 'Command' ? 'command' : 'high-command';
              if (expectedRoleId !== roleId) {
                return false;
              }
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
        
        return false;
      }

      return true;
    });
  };

  const availableDetachments = getAvailableDetachments();
  const roleName = DataLoader.getBattlefieldRoleById(roleId)?.name || 'Command';
  const triggerType = roleId === 'high-command' ? 'Apex or Auxiliary' : 'Auxiliary';

  return (
    <div className="detachment-prompt-overlay" onClick={onClose}>
      <div className="detachment-prompt-content" onClick={(e) => e.stopPropagation()}>
        <div className="detachment-prompt-header">
          <h3>Add {triggerType} Detachment</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="detachment-prompt-body">
          <p className="prompt-message">
            You've filled a {roleName} slot! You can now add a {triggerType.toLowerCase()} detachment to your force.
          </p>
          
          {availableDetachments.length > 0 ? (
            <div className="detachment-list">
              {availableDetachments.map((detachment) => (
                <div
                  key={detachment.id}
                  className="detachment-option"
                  onClick={() => {
                    onDetachmentSelected(detachment);
                    onClose();
                  }}
                >
                  <div className="detachment-info">
                    <div className="detachment-name">{detachment.name}</div>
                    <div className="detachment-type">{detachment.type}</div>
                  </div>
                  <div className="detachment-description">{detachment.description}</div>
                  <div className="detachment-slots">
                    {detachment.slots.map((slot, index) => (
                      <span key={index} className="slot-badge">
                        {slot.count}x {DataLoader.getBattlefieldRoleById(slot.roleId)?.name}
                        {slot.isPrime && <span className="prime-star">★</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-detachments">
              <p>No {triggerType.toLowerCase()} detachments available for your faction.</p>
            </div>
          )}
          
          <div className="prompt-actions">
            <button className="skip-button" onClick={onClose}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetachmentPromptModal; 
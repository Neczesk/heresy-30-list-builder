import React from 'react';
import { Button, Card } from './ui';
import { DataLoader } from '../utils/dataLoader';
import type { Detachment, Army } from '../types/army';
import styles from './DetachmentPromptModal.module.css';

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
  onDetachmentSelected
}) => {
  if (!isOpen) return null;

  const getAvailableDetachments = () => {
    const allDetachments = DataLoader.getDetachments();
    const primaryFaction = armyList.faction;
    
    // Get current faction data to check if it's a Legion subfaction
    const currentFactionData = DataLoader.getFactionById(primaryFaction);
    const isLegionSubfaction = currentFactionData?.parentFaction === 'legiones-astartes';
    
    // Get the triggering unit data from the correct detachment
    const triggeringDetachment = armyList.detachments.find(d => d.id === triggeringDetachmentId);
    const triggeringSlotId = triggeringDetachment ? `${triggeringDetachment.detachmentId}-${roleId}-${slotIndex}` : '';
    const triggeringUnit = triggeringDetachment?.units.find(unit => unit.slotId === triggeringSlotId);
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
        let hasMatchingTrigger = false;
        for (const trigger of detachment.triggers) {
          if (trigger.type === 'specific-unit') {
            // Check if the triggering unit matches the required unit
            if (trigger.requiredUnitId && triggeringUnitData) {
              if (trigger.requiredUnitId !== triggeringUnitData.id) {
                continue; // Skip this trigger, but check others
              }
            }
            
            // Check if the slot type matches
            if (trigger.requiredSlotType) {
              const expectedRoleId = trigger.requiredSlotType === 'Command' ? 'command' : 'high-command';
              if (expectedRoleId !== roleId) {
                continue; // Skip this trigger, but check others
              }
            }
            
            // If we get here, this trigger matches
            hasMatchingTrigger = true;
            break;
          }
        }
        
        // If the detachment has triggers but none match, exclude it
        if (!hasMatchingTrigger) {
          return false;
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
    <div className={styles.detachmentPromptOverlay} onClick={onClose}>
      <div className={styles.detachmentPromptContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detachmentPromptHeader}>
          <h3>Add {triggerType} Detachment</h3>
          <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
        </div>
        <div className={styles.detachmentPromptBody}>
          <p className={styles.promptMessage}>
            You've filled a {roleName} slot! You can now add a {triggerType.toLowerCase()} detachment to your force.
          </p>
          
          {availableDetachments.length > 0 ? (
            <div className={styles.detachmentList}>
              {availableDetachments.map((detachment) => (
                <Card
                  key={detachment.id}
                  variant="dark"
                  padding="lg"
                  interactive
                  className={styles.detachmentOption}
                  onClick={() => {
                    onDetachmentSelected(detachment);
                    onClose();
                  }}
                >
                  <div className={styles.detachmentInfo}>
                    <div className={styles.detachmentName}>{detachment.name}</div>
                    <div className={styles.detachmentType}>{detachment.type}</div>
                  </div>
                  <div className={styles.detachmentDescription}>{detachment.description}</div>
                  <div className={styles.detachmentSlots}>
                    {detachment.slots.map((slot, index) => (
                      <span key={index} className={styles.slotBadge}>
                        {slot.count}x {DataLoader.getBattlefieldRoleById(slot.roleId)?.name}
                        {slot.isPrime && <span className={styles.primeStar}>★</span>}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="transparent" padding="lg" className={styles.noDetachments}>
              <p>No {triggerType.toLowerCase()} detachments available for your faction.</p>
            </Card>
          )}
          
          <div className={styles.promptActions}>
            <Button variant="secondary" onClick={onClose}>
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetachmentPromptModal; 
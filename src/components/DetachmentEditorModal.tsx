import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import DetachmentSlots from './DetachmentSlots';
import UnitManagementModal from './UnitManagementModal';
import type { CustomDetachment, ArmyDetachment, ArmyUnit } from '../types/army';
import styles from './DetachmentEditorModal.module.css';

interface DetachmentEditorModalProps {
  isOpen: boolean;
  customDetachment: CustomDetachment;
  onClose: () => void;
  onSave: (updatedDetachment: CustomDetachment) => void;
}

const DetachmentEditorModal: React.FC<DetachmentEditorModalProps> = ({
  isOpen,
  customDetachment,
  onClose,
  onSave
}) => {
  const [detachment, setDetachment] = useState<ArmyDetachment | null>(null);
  const [showUnitManagementModal, setShowUnitManagementModal] = useState(false);
  const [unitManagementInfo, setUnitManagementInfo] = useState<{
    unit: ArmyUnit;
    slotId: string;
    detachmentId: string;
  } | null>(null);
  const [showDetachmentPrompt, setShowDetachmentPrompt] = useState(false);
  const [detachmentPromptInfo, setDetachmentPromptInfo] = useState<{
    roleId: string;
    slotIndex: number;
  } | null>(null);

  // Initialize detachment data when modal opens
  useEffect(() => {
    if (isOpen && customDetachment) {
      const baseDetachment = DataLoader.getDetachmentById(customDetachment.baseDetachmentId);
      const faction = DataLoader.getFactionById(customDetachment.faction);
      
      if (baseDetachment && faction) {
        const armyDetachment: ArmyDetachment = {
          id: `custom-${customDetachment.id}`,
          detachmentId: customDetachment.baseDetachmentId,
          customName: customDetachment.customName,
          baseSlots: baseDetachment.slots,
          modifiedSlots: customDetachment.units.length > 0 ? [] : baseDetachment.slots, // Will be recalculated
          units: customDetachment.units,
          primeAdvantages: customDetachment.primeAdvantages || [],
          points: 0 // Will be calculated
        };

        // Recalculate slots based on units
        const updatedDetachment = recalculateDetachmentSlots(armyDetachment);
        setDetachment(updatedDetachment);
      }
    }
  }, [isOpen, customDetachment]);

  const recalculateDetachmentSlots = (detachment: ArmyDetachment): ArmyDetachment => {
    let modifiedSlots = [...detachment.baseSlots];
    detachment.units.forEach(unit => {
      unit.primeAdvantages?.forEach(advantage => {
        if (advantage.advantageId === 'logistical-benefit' && advantage.slotModification) {
          modifiedSlots.push({
            roleId: advantage.slotModification.roleId,
            count: advantage.slotModification.count,
            isPrime: false,
            description: `Custom slot added by Logistical Benefit for unit ${unit.unitId}`
          });
        }
      });
    });
    return { ...detachment, modifiedSlots };
  };

  const calculateDetachmentPoints = (detachment: ArmyDetachment): number => {
    return detachment.units.reduce((total, unit) => total + unit.points, 0);
  };

  const handleUnitSelected = (slotId: string, unitId: string) => {
    if (!detachment) return;

    const unit = DataLoader.getUnitById(unitId);
    const faction = DataLoader.getFactionById(customDetachment.faction);
    
    if (unit && faction) {
      const newArmyUnit: ArmyUnit = {
        id: `${unitId}-${Date.now()}`,
        unitId: unitId,
        customName: undefined,
        size: 1,
        points: unit.points || 0,
        slotId: slotId,
        models: {},
        wargear: [],
        weapons: {},
        upgrades: [],
        primeAdvantages: [],
        specialRules: [],
        specialRuleValues: {},
        modelModifications: {},
        modelInstanceWeaponChanges: {},
        modelInstanceWargearChanges: {}
      };

      // Update detachment with new unit
      const updatedUnits = [...detachment.units, newArmyUnit];
      const updatedDetachment = {
        ...detachment,
        units: updatedUnits
      };

      // Recalculate slots
      const recalculatedDetachment = recalculateDetachmentSlots(updatedDetachment);
      setDetachment(recalculatedDetachment);
    }
  };

  const handleUnitUpdated = (_slotId: string, updatedUnit: ArmyUnit) => {
    if (!detachment) return;

    const updatedUnits = detachment.units.map(unit => 
      unit.id === updatedUnit.id ? updatedUnit : unit
    );

    const updatedDetachment = {
      ...detachment,
      units: updatedUnits
    };

    // Recalculate slots
    const recalculatedDetachment = recalculateDetachmentSlots(updatedDetachment);
    setDetachment(recalculatedDetachment);
  };

  const handleDetachmentPrompt = (roleId: string, slotIndex: number) => {
    setDetachmentPromptInfo({ roleId, slotIndex });
    setShowDetachmentPrompt(true);
  };

  const handleDetachmentPromptSelected = (_selectedDetachment: ArmyDetachment) => {
    // Handle detachment selection if needed
    setShowDetachmentPrompt(false);
  };

  const handleUnitManagementClose = () => {
    setShowUnitManagementModal(false);
    setUnitManagementInfo(null);
  };

  const handleSave = () => {
    if (!detachment) return;

    const updatedCustomDetachment: CustomDetachment = {
      ...customDetachment,
      units: detachment.units,
      primeAdvantages: detachment.primeAdvantages,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedCustomDetachment);
  };

  const getFactionName = (factionId: string) => {
    const faction = DataLoader.getFactionById(factionId);
    return faction?.name || factionId;
  };

  const getSubfactionName = (subfactionId: string) => {
    const subfaction = DataLoader.getFactionById(subfactionId);
    return subfaction?.name || subfactionId;
  };

  const getBaseDetachmentName = (baseDetachmentId: string) => {
    const detachment = DataLoader.getDetachmentById(baseDetachmentId);
    return detachment?.name || baseDetachmentId;
  };

  if (!isOpen || !detachment) return null;

  const totalPoints = calculateDetachmentPoints(detachment);

  return (
    <div className={`${styles['modal-overlay']} ${styles['detachment-editor-overlay']}`} onClick={onClose}>
      <div className={`${styles['modal-content']} ${styles['detachment-editor-modal']}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <div className={styles['header-content']}>
            <h2>Edit Custom Detachment</h2>
            <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
          </div>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['detachment-info-section']}>
            <div className={styles['detachment-header-info']}>
              <h3>{customDetachment.name}</h3>
              <div className={styles['detachment-meta']}>
                <span className={styles['base-detachment']}>Based on: {getBaseDetachmentName(customDetachment.baseDetachmentId)}</span>
                <span className={styles.faction}>{getFactionName(customDetachment.faction)}</span>
                {customDetachment.subfaction && (
                  <span className={styles.subfaction}>{getSubfactionName(customDetachment.subfaction)}</span>
                )}
              </div>
            </div>
            
            <div className={styles['detachment-stats']}>
              <div className={styles['stat-item']}>
                <span className={styles['stat-label']}>Units:</span>
                <span className={styles['stat-value']}>{detachment.units.length}</span>
              </div>
              <div className={styles['stat-item']}>
                <span className={styles['stat-label']}>Total Points:</span>
                <span className={styles['stat-value']}>{totalPoints} pts</span>
              </div>
            </div>

            {customDetachment.description && (
              <div className={styles['detachment-description']}>
                <span className={styles['description-label']}>Description:</span>
                <span className={styles['description-text']}>{customDetachment.description}</span>
              </div>
            )}
          </div>

          <div className={styles['detachment-slots-section']}>
            <h3>Detachment Slots</h3>
            <DetachmentSlots
              detachment={DataLoader.getDetachmentById(customDetachment.baseDetachmentId)!}
              armyDetachment={detachment}
              armyList={{
                id: 'custom-detachment-edit',
                name: customDetachment.name,
                allegiance: 'Loyalist',
                faction: 'legiones-astartes',
                subfaction: undefined,
                pointsLimit: 0,
                totalPoints: totalPoints,
                validationErrors: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isNamed: true,
                detachments: []
              }}
              onUnitSelected={handleUnitSelected}
              onUnitUpdated={handleUnitUpdated}
              onDetachmentPrompt={handleDetachmentPrompt}
            />
          </div>
        </div>

        <div className={styles['modal-actions']}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        {/* Unit Management Modal */}
        {showUnitManagementModal && unitManagementInfo && (
          <UnitManagementModal
            isOpen={showUnitManagementModal}
            unit={unitManagementInfo.unit}
            slotId={unitManagementInfo.slotId}
            detachmentId={unitManagementInfo.detachmentId}
            armyList={{
              id: 'custom-detachment-edit',
              name: customDetachment.name,
              allegiance: 'Loyalist',
              faction: 'legiones-astartes',
              subfaction: undefined,
              pointsLimit: 0,
              totalPoints: totalPoints,
              validationErrors: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isNamed: true,
              detachments: []
            }}
            onClose={handleUnitManagementClose}
            onUnitUpdated={handleUnitUpdated}
            faction={customDetachment.faction}
            subfaction={customDetachment.subfaction}
          />
        )}

        {/* Detachment Prompt Modal */}
        {showDetachmentPrompt && detachmentPromptInfo && (
          <div className={styles['detachment-prompt-overlay']} onClick={() => setShowDetachmentPrompt(false)}>
            <div className={styles['detachment-prompt-content']} onClick={(e) => e.stopPropagation()}>
              <h3>Select Detachment Type</h3>
              <p>Choose a detachment type for the {detachmentPromptInfo.roleId} slot:</p>
              <div className={styles['detachment-options']}>
                <Button 
                  variant="primary"
                  onClick={() => handleDetachmentPromptSelected({ 
                    id: 'default',
                    detachmentId: 'default',
                    customName: 'Default',
                    points: 0,
                    baseSlots: [],
                    modifiedSlots: [],
                    primeAdvantages: [],
                    units: []
                  })}
                >
                  Default Detachment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetachmentEditorModal; 
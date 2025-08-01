import React, { useState, useEffect } from 'react';
import { DataLoader } from '../utils/dataLoader';
import DetachmentSlots from './DetachmentSlots';
import UnitManagementModal from './UnitManagementModal';
import type { CustomDetachment, ArmyUnit, ArmyDetachment, Detachment } from '../types/army';
import './DetachmentEditorModal.css';

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

  const handleDetachmentPromptSelected = (_selectedDetachment: Detachment) => {
    if (!detachment || !detachmentPromptInfo) return;

    // Find available units for the selected detachment
    const availableUnits = DataLoader.getUnitsByRole(detachmentPromptInfo.roleId);
    
    if (availableUnits.length > 0) {
      // Auto-select the first available unit
      handleUnitSelected(`slot-${detachmentPromptInfo.slotIndex}`, availableUnits[0].id);
    }

    setShowDetachmentPrompt(false);
    setDetachmentPromptInfo(null);
  };

  const handleUnitManagementOpen = (unit: ArmyUnit, slotId: string, detachmentId: string) => {
    setUnitManagementInfo({ unit, slotId, detachmentId });
    setShowUnitManagementModal(true);
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
    const faction = DataLoader.getFactionById(subfactionId);
    return faction?.name || subfactionId;
  };

  const getBaseDetachmentName = (baseDetachmentId: string) => {
    const detachment = DataLoader.getDetachmentById(baseDetachmentId);
    return detachment?.name || baseDetachmentId;
  };

  if (!isOpen || !detachment) return null;

  const totalPoints = calculateDetachmentPoints(detachment);

  return (
    <div className="modal-overlay detachment-editor-overlay" onClick={onClose}>
      <div className="modal-content detachment-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h2>Edit Custom Detachment</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="detachment-info-section">
            <div className="detachment-header-info">
              <h3>{customDetachment.name}</h3>
              <div className="detachment-meta">
                <span className="base-detachment">Based on: {getBaseDetachmentName(customDetachment.baseDetachmentId)}</span>
                <span className="faction">{getFactionName(customDetachment.faction)}</span>
                {customDetachment.subfaction && (
                  <span className="subfaction">{getSubfactionName(customDetachment.subfaction)}</span>
                )}
              </div>
            </div>
            
            <div className="detachment-stats">
              <div className="stat-item">
                <span className="stat-label">Units:</span>
                <span className="stat-value">{detachment.units.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Points:</span>
                <span className="stat-value">{totalPoints} pts</span>
              </div>
            </div>

            {customDetachment.description && (
              <div className="detachment-description">
                <span className="description-label">Description:</span>
                <span className="description-text">{customDetachment.description}</span>
              </div>
            )}
          </div>

          <div className="detachment-slots-section">
            <h3>Detachment Slots</h3>
            <DetachmentSlots
              detachment={DataLoader.getDetachmentById(customDetachment.baseDetachmentId) as Detachment}
              armyDetachment={detachment}
              armyList={{
                id: 'custom-detachment-edit',
                name: customDetachment.name,
                faction: customDetachment.faction,
                allegiance: 'Universal',
                pointsLimit: 0,
                totalPoints: totalPoints,
                detachments: [detachment],
                validationErrors: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isNamed: true
              }}
              onUnitSelected={handleUnitSelected}
              onUnitManagementOpen={handleUnitManagementOpen}
              onDetachmentPrompt={handleDetachmentPrompt}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
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
              faction: customDetachment.faction,
              allegiance: 'Universal',
              pointsLimit: 0,
              totalPoints: totalPoints,
              detachments: [detachment],
              validationErrors: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isNamed: true
            }}
            onClose={handleUnitManagementClose}
            onUnitUpdated={handleUnitUpdated}
            faction={customDetachment.faction}
            subfaction={customDetachment.subfaction}
          />
        )}

        {/* Detachment Prompt Modal */}
        {showDetachmentPrompt && detachmentPromptInfo && (
          <div className="detachment-prompt-overlay" onClick={() => setShowDetachmentPrompt(false)}>
            <div className="detachment-prompt-content" onClick={(e) => e.stopPropagation()}>
              <h3>Select Detachment Type</h3>
              <p>Choose a detachment type for the {detachmentPromptInfo.roleId} slot:</p>
              <div className="detachment-options">
                <button 
                  className="detachment-option"
                  onClick={() => handleDetachmentPromptSelected({ 
                    id: 'default', 
                    name: 'Default', 
                    type: 'Primary', 
                    slots: [],
                    faction: customDetachment.faction,
                    description: 'Default detachment type',
                    requirements: []
                  })}
                >
                  Default Detachment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetachmentEditorModal; 
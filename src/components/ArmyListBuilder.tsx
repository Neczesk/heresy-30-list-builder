import React, { useState, useEffect, useCallback } from 'react';
import { ArmyListStorage } from '../utils/armyListStorage';
import { DataLoader } from '../utils/dataLoader';
import { CustomUnitStorage } from '../utils/customUnitStorage';
import type { Army, Detachment, Faction, ArmyUnit, Allegiance, ArmyDetachment } from '../types/army';
import DetachmentSelector from './DetachmentSelector';
import AddDetachmentModal from './AddDetachmentModal';
import DetachmentSlots from './DetachmentSlots';
import DetachmentPromptModal from './DetachmentPromptModal';
import UnitManagementModal from './UnitManagementModal';
import SaveCustomDetachmentModal from './SaveCustomDetachmentModal';
import LoadCustomDetachmentModal from './LoadCustomDetachmentModal';
import { testAlliedDetachmentAvailability } from '../utils/testDataStructure';
import './ArmyListBuilder.css';

interface ArmyListBuilderProps {
  onBackToMenu: () => void;
  initialArmyList?: Army | null;
}

const ArmyListBuilder: React.FC<ArmyListBuilderProps> = ({
  onBackToMenu,
  initialArmyList
}) => {
  const [armyList, setArmyList] = useState<Army | null>(initialArmyList || null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showDetachmentSelector, setShowDetachmentSelector] = useState(false);
  const [showAddDetachmentModal, setShowAddDetachmentModal] = useState(false);
  const [showDetachmentPrompt, setShowDetachmentPrompt] = useState(false);
  const [detachmentPromptInfo, setDetachmentPromptInfo] = useState<{
    roleId: string;
    slotIndex: number;
  } | null>(null);
  const [showUnitManagementModal, setShowUnitManagementModal] = useState(false);
  const [unitManagementInfo, setUnitManagementInfo] = useState<{
    unit: ArmyUnit;
    slotId: string;
    detachmentId: string;
  } | null>(null);
  const [showSaveCustomDetachmentModal, setShowSaveCustomDetachmentModal] = useState(false);
  const [detachmentToSave, setDetachmentToSave] = useState<ArmyDetachment | null>(null);
  const [showLoadCustomDetachmentModal, setShowLoadCustomDetachmentModal] = useState(false);
  const [detachmentToLoad, setDetachmentToLoad] = useState<ArmyDetachment | null>(null);
  const [showPointsLimitInput, setShowPointsLimitInput] = useState(false);
  const [tempPointsLimit, setTempPointsLimit] = useState('');

  // Auto-save army list after changes
  useEffect(() => {
    if (armyList) {
      const timeoutId = setTimeout(() => {
        ArmyListStorage.saveArmyList(armyList);
      }, 1000); // Debounce auto-save

      return () => clearTimeout(timeoutId);
    }
  }, [armyList]);

  // Show detachment selector if no army list exists
  useEffect(() => {
    if (!armyList) {
      setShowDetachmentSelector(true);
    }
  }, [armyList]);

  const updateArmyList = useCallback((updater: (list: Army) => Army) => {
    setArmyList(prevList => {
      if (!prevList) return prevList;
      const updatedList = updater(prevList);
      return {
        ...updatedList,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const handleNameArmyList = () => {
    if (tempName.trim()) {
      updateArmyList(list => ({
        ...list,
        name: tempName.trim(),
        isNamed: true
      }));
      setShowNameDialog(false);
      setTempName('');
    }
  };

  const handlePointsLimitChange = () => {
    const newPointsLimit = parseInt(tempPointsLimit, 10);
    if (!isNaN(newPointsLimit) && newPointsLimit > 0) {
      updateArmyList(list => ({
        ...list,
        pointsLimit: newPointsLimit
      }));
      setShowPointsLimitInput(false);
      setTempPointsLimit('');
    }
  };

  const calculateTotalPoints = (list: Army): number => {
    return list.detachments.reduce((total: number, detachment: ArmyDetachment) => {
      return total + calculateDetachmentPoints(detachment);
    }, 0);
  };

  const calculateDetachmentPoints = (detachment: ArmyDetachment): number => {
    return detachment.units.reduce((total: number, unit: ArmyUnit) => {
      return total + unit.points;
    }, 0);
  };

  // Update total points when detachments change
  useEffect(() => {
    if (armyList) {
      const totalPoints = calculateTotalPoints(armyList);
      if (totalPoints !== armyList.totalPoints) {
        updateArmyList(list => ({
          ...list,
          totalPoints
        }));
      }
    }
  }, [armyList?.detachments, updateArmyList]);

  const handleDetachmentSelected = (detachment: Detachment, faction: Faction, allegiance: Allegiance, subFaction?: Faction) => {
    const finalFaction = subFaction || faction;
    const newList = ArmyListStorage.createNewArmyList(finalFaction.id, 2000, allegiance);
    newList.name = subFaction ? `${subFaction.name} Army` : `${faction.name} Army`;
    newList.detachments.push({
      id: `${detachment.id}-${Date.now()}`,
      detachmentId: detachment.id,
      customName: undefined,
      points: 0,
      baseSlots: detachment.slots,
      modifiedSlots: detachment.slots,
      primeAdvantages: [],
      units: []
    });
    
    setArmyList(newList);
    setShowDetachmentSelector(false);
  };

  const handleAddDetachment = (detachment: Detachment) => {
    if (!armyList) return;
    
    const newDetachment = {
      id: `${detachment.id}-${Date.now()}`,
      detachmentId: detachment.id,
      customName: undefined,
      points: 0,
      baseSlots: detachment.slots,
      modifiedSlots: detachment.slots,
      primeAdvantages: [],
      units: []
    };
    
    updateArmyList(list => ({
      ...list,
      detachments: [...list.detachments, newDetachment]
    }));
    
    setShowAddDetachmentModal(false);
  };

  const handleRemoveDetachment = (detachmentId: string) => {
    if (!armyList) return;
    
    updateArmyList(list => {
      // Find the detachment to remove
      const detachmentToRemove = list.detachments.find(d => d.detachmentId === detachmentId);
      if (!detachmentToRemove) return list;
      
      // Get all slotIds from units in this detachment
      const slotIdsInDetachment = detachmentToRemove.units.map(unit => unit.slotId);
      
      // Remove the target detachment and any detachments triggered by its units
      const updatedDetachments = list.detachments.filter(detachment => {
        // Remove the target detachment
        if (detachment.detachmentId === detachmentId) {
          return false;
        }
        
        // Remove any detachments triggered by units in the removed detachment
        if (detachment.triggeredBy && slotIdsInDetachment.includes(detachment.triggeredBy.slotId)) {
          return false;
        }
        
        return true;
      });
      
      return {
        ...list,
        detachments: updatedDetachments
      };
    });
  };

  const handleDetachmentPrompt = (roleId: string, slotIndex: number) => {
    setDetachmentPromptInfo({ roleId, slotIndex });
    setShowDetachmentPrompt(true);
  };

  const handleDetachmentPromptSelected = (detachment: Detachment) => {
    if (!armyList || !detachmentPromptInfo) return;
    
    // Create the slotId of the unit that triggered this detachment
    const triggeringSlotId = `${armyList.detachments[0].detachmentId}-${detachmentPromptInfo.roleId}-${detachmentPromptInfo.slotIndex}`;
    
    console.log('Adding detachment:', detachment.id);
    console.log('Triggering slot ID:', triggeringSlotId);
    console.log('Available units in primary detachment:', armyList.detachments[0].units.map(u => ({ unitId: u.unitId, slotId: u.slotId })));
    console.log('Looking for unit with slotId:', triggeringSlotId);
    
    // Find the triggering unit - try exact slot ID match first, then fallback to role-based search
    let triggeringUnit = armyList.detachments[0].units.find(unit => unit.slotId === triggeringSlotId);
    
    if (!triggeringUnit) {
      console.log('Exact slot ID match failed, trying role-based search...');
      // Fallback: find any unit in the primary detachment that matches the role
      triggeringUnit = armyList.detachments[0].units.find(unit => {
        if (!unit.slotId) return false;
        const unitSlotParts = unit.slotId.split('-');
        const unitRoleId = unitSlotParts[unitSlotParts.length - 2];
        return unitRoleId === detachmentPromptInfo.roleId;
      });
    }
    
    if (!triggeringUnit || !triggeringUnit.slotId) {
      console.log('Triggering unit not found!');
      return;
    }
    
    console.log('Found triggering unit:', triggeringUnit.unitId, 'with slotId:', triggeringUnit.slotId);
    
    // Add the selected detachment to the army list with the triggering unit reference
    const newDetachment = {
      id: `${detachment.id}-${Date.now()}`,
      detachmentId: detachment.id,
      customName: undefined,
      points: 0,
      baseSlots: detachment.slots,
      modifiedSlots: detachment.slots,
      primeAdvantages: [],
      units: [],
      triggeredBy: {
        unitId: triggeringUnit.unitId,
        slotId: triggeringUnit.slotId // Use the actual slot ID from the unit
      }
    };
    
    updateArmyList(list => ({
      ...list,
      detachments: [...list.detachments, newDetachment]
    }));
    
    setShowDetachmentPrompt(false);
    setDetachmentPromptInfo(null);
  };

  const handleUnitSelected = (detachmentId: string, slotId: string, unitId: string) => {
    if (!armyList) return;
    
    updateArmyList(list => {
      // Find the detachment
      const detachmentIndex = list.detachments.findIndex(d => d.detachmentId === detachmentId);
      if (detachmentIndex === -1) return list;

      const updatedDetachments = [...list.detachments];
      const detachment = updatedDetachments[detachmentIndex];
      
      if (unitId === '') {
        // Unit removal - remove the unit from the specific slot
        const unitToRemoveIndex = detachment.units.findIndex(unit => unit.slotId === slotId);
        
        if (unitToRemoveIndex !== -1) {
          const unitToRemove = detachment.units[unitToRemoveIndex];
          detachment.units.splice(unitToRemoveIndex, 1);
          
          // Check if this unit triggered any detachments and remove them
          const triggeredDetachments = updatedDetachments.filter(d => 
            d.triggeredBy && d.triggeredBy.unitId === unitToRemove.unitId && d.triggeredBy.slotId === slotId
          );
          triggeredDetachments.forEach(triggeredDetachment => {
            const triggeredIndex = updatedDetachments.findIndex(d => d.detachmentId === triggeredDetachment.detachmentId);
            if (triggeredIndex !== -1) {
              updatedDetachments.splice(triggeredIndex, 1);
            }
          });
        }
        
        // Recalculate slots after unit removal
        const updatedDetachment = recalculateDetachmentSlots(detachment);
        updatedDetachments[detachmentIndex] = updatedDetachment;
        
        return {
          ...list,
          detachments: updatedDetachments
        };
      }

      // Handle custom unit selection
      if (unitId.startsWith('custom:')) {
        const customUnitId = unitId.substring(7); // Remove 'custom:' prefix
        const customUnit = CustomUnitStorage.getCustomUnit(customUnitId);
        if (!customUnit) return list;

        // Get base unit data
        const baseUnitData = DataLoader.getUnitById(customUnit.baseUnitId);
        if (!baseUnitData) return list;

        // Create army unit from custom unit
        const newArmyUnit = {
          id: `${customUnit.baseUnitId}-${Date.now()}`,
          unitId: customUnit.baseUnitId, // Use the base unit ID
          customName: undefined,
          size: baseUnitData.baseSize,
          points: baseUnitData.points + customUnit.upgrades.reduce((total: number, upgrade: any) => total + (upgrade.points * upgrade.count), 0),
          slotId: slotId,
          originalCustomUnitId: customUnitId, // Track the original custom unit ID
          models: baseUnitData.models || {},
          wargear: (baseUnitData.wargear || []).filter(w => w.isDefault).map(w => w.id),
          weapons: {},
          upgrades: customUnit.upgrades,
          primeAdvantages: customUnit.primeAdvantages,
          specialRules: baseUnitData.specialRules || [],
          specialRuleValues: baseUnitData.specialRuleValues || {},
          modelModifications: {},
          modelInstanceWeaponChanges: customUnit.modelInstanceWeaponChanges,
          modelInstanceWargearChanges: customUnit.modelInstanceWargearChanges
        };

        // Check if a unit already exists in this slot
        const existingUnitIndex = detachment.units.findIndex(unit => unit.slotId === slotId);
        if (existingUnitIndex !== -1) {
          console.log('Unit already exists in slot, replacing:', slotId);
          detachment.units[existingUnitIndex] = newArmyUnit;
        } else {
          // Add unit to detachment
          detachment.units.push(newArmyUnit);
        }

        // Recalculate slots after unit addition/replacement
        const updatedDetachment = recalculateDetachmentSlots(detachment);
        updatedDetachments[detachmentIndex] = updatedDetachment;

        return {
          ...list,
          detachments: updatedDetachments
        };
      }
      
      // Handle base unit selection
      const unitData = DataLoader.getUnitById(unitId);
      if (!unitData) return list;

      // Check if a unit already exists in this slot
      const existingUnitIndex = detachment.units.findIndex(unit => unit.slotId === slotId);
      if (existingUnitIndex !== -1) {
        console.log('Unit already exists in slot, replacing:', slotId);
        // Replace the existing unit
        const newArmyUnit = {
          id: `${unitId}-${Date.now()}`,
          unitId: unitId,
          customName: undefined,
          size: unitData.baseSize,
          points: unitData.points,
          slotId: slotId,
          models: unitData.models || {},
          wargear: (unitData.wargear || []).filter(w => w.isDefault).map(w => w.id),
          weapons: {},
          upgrades: [],
          primeAdvantages: [],
          specialRules: unitData.specialRules || [],
          specialRuleValues: unitData.specialRuleValues || {},
          modelModifications: {},
          modelInstanceWeaponChanges: {},
          modelInstanceWargearChanges: {}
        };
        
        detachment.units[existingUnitIndex] = newArmyUnit;
      } else {
        // Create new army unit with slot assignment
        const newArmyUnit = {
          id: `${unitId}-${Date.now()}`,
          unitId: unitId,
          customName: undefined,
          size: unitData.baseSize,
          points: unitData.points,
          slotId: slotId,
          models: unitData.models || {},
          wargear: (unitData.wargear || []).filter(w => w.isDefault).map(w => w.id),
          weapons: {},
          upgrades: [],
          primeAdvantages: [],
          specialRules: unitData.specialRules || [],
          specialRuleValues: unitData.specialRuleValues || {},
          modelModifications: {},
          modelInstanceWeaponChanges: {},
          modelInstanceWargearChanges: {}
        };
        
        // Add unit to detachment
        detachment.units.push(newArmyUnit);
      }
      
      // Recalculate slots after unit addition/replacement
      const updatedDetachment = recalculateDetachmentSlots(detachment);
      updatedDetachments[detachmentIndex] = updatedDetachment;
      
      return {
        ...list,
        detachments: updatedDetachments
      };
    });
  };

  // Helper function to recalculate detachment slots based on unit prime advantages
  const recalculateDetachmentSlots = (detachment: ArmyDetachment): ArmyDetachment => {
    // Start with base slots
    let modifiedSlots = [...detachment.baseSlots];
    
    // Check all units in this detachment for logistical-benefit prime advantages
    detachment.units.forEach(unit => {
      unit.primeAdvantages?.forEach(advantage => {
        if (advantage.advantageId === 'logistical-benefit' && advantage.slotModification) {
          // Add the custom slot from logistical-benefit
          modifiedSlots.push({
            roleId: advantage.slotModification.roleId,
            count: advantage.slotModification.count,
            isPrime: false,
            description: `Custom slot added by Logistical Benefit for unit ${unit.unitId}`
          });
        }
      });
    });
    
    return {
      ...detachment,
      modifiedSlots
    };
  };

  const handleUnitUpdated = (slotId: string, updatedUnit: ArmyUnit) => {
    if (!armyList) return;
    
    updateArmyList(list => {
      const updatedDetachments = list.detachments.map(detachment => {
        const unitIndex = detachment.units.findIndex(unit => unit.slotId === slotId);
        if (unitIndex !== -1) {
          const updatedUnits = [...detachment.units];
          updatedUnits[unitIndex] = updatedUnit;
          
          // Recalculate detachment slots based on updated unit prime advantages
          const updatedDetachment = { ...detachment, units: updatedUnits };
          return recalculateDetachmentSlots(updatedDetachment);
        }
        return detachment;
      });
      
      return {
        ...list,
        detachments: updatedDetachments
      };
    });
  };



  const handleDetachmentRemoved = (detachmentId: string) => {
    handleRemoveDetachment(detachmentId);
  };

  const handleUnitManagementOpen = (unit: ArmyUnit, slotId: string, detachmentId: string) => {
    setUnitManagementInfo({ unit, slotId, detachmentId });
    setShowUnitManagementModal(true);
  };

  const handleUnitManagementClose = () => {
    setShowUnitManagementModal(false);
    setUnitManagementInfo(null);
  };

  const handleSaveCustomDetachment = (armyDetachment: ArmyDetachment) => {
    setDetachmentToSave(armyDetachment);
    setShowSaveCustomDetachmentModal(true);
  };

  const handleCustomDetachmentSaved = (customDetachmentId: string) => {
    console.log('Custom detachment saved with ID:', customDetachmentId);
    setShowSaveCustomDetachmentModal(false);
    setDetachmentToSave(null);
  };

  const handleLoadCustomDetachment = (armyDetachment: ArmyDetachment) => {
    setDetachmentToLoad(armyDetachment);
    setShowLoadCustomDetachmentModal(true);
  };

  const handleCustomDetachmentLoaded = (customDetachment: any) => {
    console.log('Loading custom detachment:', customDetachment.id);
    
    if (!armyList || !detachmentToLoad) return;

    updateArmyList(list => {
      const updatedDetachments = list.detachments.map(detachment => {
        if (detachment.id === detachmentToLoad.id) {
          // Create new ArmyDetachment with custom detachment data
          const updatedDetachment: ArmyDetachment = {
            ...detachment,
            customName: customDetachment.customName,
            units: customDetachment.units,
            primeAdvantages: customDetachment.primeAdvantages,
            // Recalculate slots based on the loaded units
            modifiedSlots: recalculateDetachmentSlots({
              ...detachment,
              units: customDetachment.units,
              primeAdvantages: customDetachment.primeAdvantages
            }).modifiedSlots
          };
          return updatedDetachment;
        }
        return detachment;
      });

      return {
        ...list,
        detachments: updatedDetachments
      };
    });

    setShowLoadCustomDetachmentModal(false);
    setDetachmentToLoad(null);
  };

  const handleDebugTest = () => {
    testAlliedDetachmentAvailability();
  };

  if (showDetachmentSelector) {
    return (
      <DetachmentSelector
        onDetachmentSelected={handleDetachmentSelected}
        onCancel={onBackToMenu}
      />
    );
  }

  if (!armyList) {
    return (
      <div className="placeholder-view">
        <p>Loading army list...</p>
      </div>
    );
  }

  const primaryFaction = DataLoader.getFactionById(armyList.faction);
  const availableDetachments = DataLoader.getAvailableDetachments(armyList);

  return (
    <div className="army-list-builder">
      {/* Header */}
      <div className="builder-header">
        <button className="back-button" onClick={onBackToMenu}>
          ← Back to Menu
        </button>
        <div className="header-info">
          <h1>{armyList.name}</h1>
          <div className="army-stats">
            <span className="faction">{primaryFaction?.name}</span>
            <span className="points">{armyList.totalPoints} / {armyList.pointsLimit} pts</span>
            <span className="detachments">{armyList.detachments.length} detachments</span>
          </div>
        </div>
        <div className="header-actions">
          {!armyList.isNamed && (
            <button 
              className="name-button"
              onClick={() => setShowNameDialog(true)}
            >
              Name List
            </button>
          )}
          <button 
            className="points-limit-button"
            onClick={() => {
              setTempPointsLimit(armyList.pointsLimit.toString());
              setShowPointsLimitInput(true);
            }}
          >
            Set Points Limit
          </button>
          {availableDetachments.length > 0 && (
            <button 
              className="add-detachment-button"
              onClick={() => setShowAddDetachmentModal(true)}
            >
              + Add Detachment
            </button>
          )}
          <button 
            className="debug-button"
            onClick={handleDebugTest}
            style={{ background: '#ff5722', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
          >
            Debug
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="builder-content">
        <div className="detachments-section">
          <h2>Detachments</h2>
          {armyList.detachments.length === 0 ? (
            <div className="empty-state">
              <p>No detachments added yet.</p>
            </div>
          ) : (
            <div className="detachments-list">
              {armyList.detachments.map((armyDetachment, index) => {
                const detachment = DataLoader.getDetachmentById(armyDetachment.detachmentId);
                if (!detachment) return null;

                return (
                  <div key={index} className="detachment-card">
                    <div className="detachment-header">
                      <h3>{detachment.name}</h3>
                      <span className="detachment-type">{detachment.type}</span>
                      <div className="detachment-actions">
                        <button 
                          className="load-detachment-button"
                          onClick={() => handleLoadCustomDetachment(armyDetachment)}
                          title="Load Custom Detachment"
                        >
                          📂
                        </button>
                        <button 
                          className="save-detachment-button"
                          onClick={() => handleSaveCustomDetachment(armyDetachment)}
                          title="Save as Custom Detachment"
                        >
                          💾
                        </button>
                        {index > 0 && (
                          <button 
                            className="remove-detachment-button"
                            onClick={() => handleRemoveDetachment(armyDetachment.detachmentId)}
                            title="Remove Detachment"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="detachment-description">{detachment.description}</p>
                    
                    {/* Visual Slot Display */}
                    <DetachmentSlots
                      key={armyDetachment.detachmentId}
                      detachment={detachment}
                      armyDetachment={armyDetachment}
                      armyList={armyList}
                      onUnitSelected={handleUnitSelected}
                      onDetachmentPrompt={handleDetachmentPrompt}
                      onUnitUpdated={handleUnitUpdated}
                      onDetachmentRemoved={handleDetachmentRemoved}
                      onUnitManagementOpen={handleUnitManagementOpen}
                    />
                    
                    <div className="detachment-units">
                      <span className="units-count">{armyDetachment.units.length} units</span>
                      <span className="detachment-points">{calculateDetachmentPoints(armyDetachment)} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Detachments Info */}
        {availableDetachments.length > 0 && (
          <div className="available-detachments">
            <h3>Available Detachments ({availableDetachments.length})</h3>
            <p>Add units to Command or High Command slots to unlock more detachments.</p>
          </div>
        )}
      </div>

      {/* Points Limit Dialog */}
      {showPointsLimitInput && (
        <div className="modal-overlay" onClick={() => setShowPointsLimitInput(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Set Points Limit</h3>
            <input
              type="number"
              value={tempPointsLimit}
              onChange={(e) => setTempPointsLimit(e.target.value)}
              placeholder="Enter points limit..."
              className="points-input"
              min="1"
              step="1"
            />
            <div className="modal-actions">
              <button onClick={() => setShowPointsLimitInput(false)}>Cancel</button>
              <button onClick={handlePointsLimitChange} disabled={!tempPointsLimit.trim() || isNaN(parseInt(tempPointsLimit, 10)) || parseInt(tempPointsLimit, 10) <= 0}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Name Dialog */}
      {showNameDialog && (
        <div className="modal-overlay" onClick={() => setShowNameDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Name Your Army List</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter army list name..."
              className="name-input"
            />
            <div className="modal-actions">
              <button onClick={() => setShowNameDialog(false)}>Cancel</button>
              <button onClick={handleNameArmyList} disabled={!tempName.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Detachment Modal */}
      {showAddDetachmentModal && armyList && (
        <AddDetachmentModal
          armyList={armyList}
          onAddDetachment={handleAddDetachment}
          onClose={() => setShowAddDetachmentModal(false)}
        />
      )}

      {/* Detachment Prompt Modal */}
      {showDetachmentPrompt && detachmentPromptInfo && armyList && (
        <DetachmentPromptModal
          isOpen={showDetachmentPrompt}
          roleId={detachmentPromptInfo.roleId}
          slotIndex={detachmentPromptInfo.slotIndex}
          armyList={armyList}
          onClose={() => {
            setShowDetachmentPrompt(false);
            setDetachmentPromptInfo(null);
          }}
          onDetachmentSelected={handleDetachmentPromptSelected}
        />
      )}

      {/* Unit Management Modal */}
      {showUnitManagementModal && unitManagementInfo && armyList && (
        <UnitManagementModal
          isOpen={showUnitManagementModal}
          unit={unitManagementInfo.unit}
          slotId={unitManagementInfo.slotId}
          detachmentId={unitManagementInfo.detachmentId}
          armyList={armyList}
          onClose={handleUnitManagementClose}
          onUnitUpdated={handleUnitUpdated}
          onDetachmentPrompt={handleDetachmentPrompt}
          onDetachmentRemoved={handleDetachmentRemoved}
          faction={armyList.faction}
        />
      )}

      {/* Save Custom Detachment Modal */}
      {showSaveCustomDetachmentModal && detachmentToSave && armyList && (
        <SaveCustomDetachmentModal
          isOpen={showSaveCustomDetachmentModal}
          detachment={detachmentToSave}
          faction={armyList.faction}
          subfaction={armyList.subfaction}
          onClose={() => {
            setShowSaveCustomDetachmentModal(false);
            setDetachmentToSave(null);
          }}
          onSaved={handleCustomDetachmentSaved}
        />
      )}

      {/* Load Custom Detachment Modal */}
      {showLoadCustomDetachmentModal && detachmentToLoad && armyList && (
        <LoadCustomDetachmentModal
          isOpen={showLoadCustomDetachmentModal}
          baseDetachmentId={detachmentToLoad.detachmentId}
          currentDetachment={detachmentToLoad}
          onClose={() => {
            setShowLoadCustomDetachmentModal(false);
            setDetachmentToLoad(null);
          }}
          onLoad={handleCustomDetachmentLoaded}
        />
      )}
    </div>
  );
};

export default ArmyListBuilder; 
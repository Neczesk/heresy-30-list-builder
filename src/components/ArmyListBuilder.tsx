import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import AddDetachmentModal from './AddDetachmentModal';
import DetachmentPromptModal from './DetachmentPromptModal';
import UnitManagementModal from './UnitManagementModal';
import SaveCustomDetachmentModal from './SaveCustomDetachmentModal';
import LoadCustomDetachmentModal from './LoadCustomDetachmentModal';
import DetachmentSlots from './DetachmentSlots';
import type { Army, ArmyDetachment, ArmyUnit, Detachment, Faction, Allegiance } from '../types/army';
import './ArmyListBuilder.css';

interface ArmyListBuilderProps {
  onBackToMenu: () => void;
  initialArmyList?: Army | null;
}

const ArmyListBuilder: React.FC<ArmyListBuilderProps> = ({
  onBackToMenu,
  initialArmyList
}) => {
  const [armyList, setArmyList] = useState<Army>(initialArmyList || {
    id: `army-${Date.now()}`,
    name: 'New Army List',
    allegiance: 'Universal',
    faction: '',
    pointsLimit: 3000,
    totalPoints: 0,
    detachments: [],
    validationErrors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isNamed: false
  });

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
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showPointsLimitInput, setShowPointsLimitInput] = useState(false);
  const [tempPointsLimit, setTempPointsLimit] = useState('');

  const primaryFaction = DataLoader.getFactionById(armyList.faction);
  const availableDetachments = DataLoader.getAvailableDetachments(armyList);

  // Update total points whenever detachments change
  useEffect(() => {
    const totalPoints = calculateTotalPoints(armyList);
    setArmyList(prev => ({ ...prev, totalPoints }));
  }, [armyList.detachments]);

  const handleNameArmyList = () => {
    if (tempName.trim()) {
      setArmyList(prev => ({
        ...prev,
        name: tempName.trim(),
        isNamed: true,
        updatedAt: new Date().toISOString()
      }));
      setShowNameDialog(false);
      setTempName('');
    }
  };

  const handlePointsLimitChange = () => {
    const points = parseInt(tempPointsLimit, 10);
    if (points > 0) {
      setArmyList(prev => ({
        ...prev,
        pointsLimit: points,
        updatedAt: new Date().toISOString()
      }));
      setShowPointsLimitInput(false);
      setTempPointsLimit('');
    }
  };

  const calculateTotalPoints = (list: Army): number => {
    return list.detachments.reduce((total, detachment) => {
      return total + calculateDetachmentPoints(detachment);
    }, 0);
  };

  const calculateDetachmentPoints = (detachment: ArmyDetachment): number => {
    return detachment.units.reduce((total, unit) => {
      return total + unit.points;
    }, 0);
  };

  const handleDetachmentSelected = (detachment: Detachment, faction: Faction, allegiance: Allegiance, subFaction?: Faction) => {
    // Update army list with faction and allegiance if this is the first detachment
    if (armyList.detachments.length === 0) {
      setArmyList(prev => ({
        ...prev,
        faction: faction.id,
        allegiance: allegiance,
        subfaction: subFaction?.id,
        updatedAt: new Date().toISOString()
      }));
    }

    // Create new army detachment
    const newArmyDetachment: ArmyDetachment = {
      id: `detachment-${Date.now()}`,
      detachmentId: detachment.id,
      points: 0,
      baseSlots: detachment.slots,
      modifiedSlots: detachment.slots,
      primeAdvantages: [],
      units: []
    };

    setArmyList(prev => ({
      ...prev,
      detachments: [...prev.detachments, newArmyDetachment],
      updatedAt: new Date().toISOString()
    }));

    setShowAddDetachmentModal(false);
  };

  const handleAddDetachment = (detachment: Detachment) => {
    // If this is the first detachment, we need to get faction info
    if (armyList.detachments.length === 0) {
      // This should be handled by the modal, but as a fallback
      const faction = DataLoader.getFactionById(detachment.faction);
      if (faction) {
        handleDetachmentSelected(detachment, faction, faction.allegiance);
      }
    } else {
      // For subsequent detachments, we can add directly
      const newArmyDetachment: ArmyDetachment = {
        id: `detachment-${Date.now()}`,
        detachmentId: detachment.id,
        points: 0,
        baseSlots: detachment.slots,
        modifiedSlots: detachment.slots,
        primeAdvantages: [],
        units: []
      };

      setArmyList(prev => ({
        ...prev,
        detachments: [...prev.detachments, newArmyDetachment],
        updatedAt: new Date().toISOString()
      }));
    }

    setShowAddDetachmentModal(false);
  };

  const handleRemoveDetachment = (detachmentId: string) => {
    setArmyList(prev => ({
      ...prev,
      detachments: prev.detachments.filter(d => d.id !== detachmentId),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleDetachmentPrompt = (roleId: string, slotIndex: number) => {
    setDetachmentPromptInfo({ roleId, slotIndex });
    setShowDetachmentPrompt(true);
  };

  const handleDetachmentPromptSelected = (_detachment: Detachment) => {
    if (!detachmentPromptInfo) return;

    // Find available units for the selected detachment
    const availableUnits = DataLoader.getUnitsByRole(detachmentPromptInfo.roleId);
    
    if (availableUnits.length > 0) {
      // Auto-select the first available unit
      const slotId = `slot-${detachmentPromptInfo.slotIndex}`;
      handleUnitSelected('temp-detachment-id', slotId, availableUnits[0].id);
    }

    setShowDetachmentPrompt(false);
    setDetachmentPromptInfo(null);
  };

  const handleUnitSelected = (detachmentId: string, slotId: string, unitId: string) => {
    if (unitId === '') {
      // Remove unit from slot
      setArmyList(prev => ({
        ...prev,
        detachments: prev.detachments.map(detachment => {
          if (detachment.id === detachmentId) {
            return {
              ...detachment,
              units: detachment.units.filter(unit => unit.slotId !== slotId)
            };
          }
          return detachment;
        }),
        updatedAt: new Date().toISOString()
      }));
      return;
    }

    const unit = DataLoader.getUnitById(unitId);
    const faction = DataLoader.getFactionById(armyList.faction);
    
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

      setArmyList(prev => ({
        ...prev,
        detachments: prev.detachments.map(detachment => {
          if (detachment.id === detachmentId) {
            // Remove any existing unit in this slot
            const filteredUnits = detachment.units.filter(unit => unit.slotId !== slotId);
            
            return {
              ...detachment,
              units: [...filteredUnits, newArmyUnit]
            };
          }
          return detachment;
        }),
        updatedAt: new Date().toISOString()
      }));
    }
  };

  const recalculateDetachmentSlots = (detachment: ArmyDetachment): ArmyDetachment => {
    let modifiedSlots = [...detachment.baseSlots];
    
    // Check for logistical benefit prime advantages
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

  const handleUnitUpdated = (slotId: string, updatedUnit: ArmyUnit) => {
    setArmyList(prev => ({
      ...prev,
      detachments: prev.detachments.map(detachment => {
        const updatedUnits = detachment.units.map(unit => 
          unit.slotId === slotId ? updatedUnit : unit
        );
        
        const updatedDetachment = {
          ...detachment,
          units: updatedUnits
        };
        
        // Recalculate slots based on updated units
        return recalculateDetachmentSlots(updatedDetachment);
      }),
      updatedAt: new Date().toISOString()
    }));
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

  const handleCustomDetachmentSaved = (_customDetachmentId: string) => {
    setShowSaveCustomDetachmentModal(false);
    setDetachmentToSave(null);
  };

  const handleLoadCustomDetachment = (armyDetachment: ArmyDetachment) => {
    setDetachmentToLoad(armyDetachment);
    setShowLoadCustomDetachmentModal(true);
  };

  const handleCustomDetachmentLoaded = (customDetachment: any) => {
    if (!detachmentToLoad) return;

    // Update the detachment with custom detachment data
    setArmyList(prev => ({
      ...prev,
      detachments: prev.detachments.map(detachment => {
        if (detachment.id === detachmentToLoad.id) {
          return {
            ...detachment,
            units: customDetachment.units,
            primeAdvantages: customDetachment.primeAdvantages || [],
            updatedAt: new Date().toISOString()
          };
        }
        return detachment;
      }),
      updatedAt: new Date().toISOString()
    }));

    setShowLoadCustomDetachmentModal(false);
    setDetachmentToLoad(null);
  };

  const handleDebugTest = () => {
    console.log('Current Army List:', armyList);
    console.log('Primary Faction:', primaryFaction);
    console.log('Available Detachments:', availableDetachments);
  };

  return (
    <div className="army-list-builder">
      {/* Header */}
      <div className="builder-header">
        <Button variant="secondary" onClick={onBackToMenu}>
          ← Back to Menu
        </Button>
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
            <Button 
              variant="info"
              onClick={() => setShowNameDialog(true)}
            >
              Name List
            </Button>
          )}
          <Button 
            variant="info"
            onClick={() => {
              setTempPointsLimit(armyList.pointsLimit.toString());
              setShowPointsLimitInput(true);
            }}
          >
            Set Points Limit
          </Button>
          {availableDetachments.length > 0 && (
            <Button 
              variant="success"
              onClick={() => setShowAddDetachmentModal(true)}
            >
              + Add Detachment
            </Button>
          )}
          <Button 
            variant="warning"
            onClick={handleDebugTest}
            size="sm"
          >
            Debug
          </Button>
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
                        <Button 
                          variant="info"
                          size="sm"
                          onClick={() => handleLoadCustomDetachment(armyDetachment)}
                          title="Load Custom Detachment"
                        >
                          📂
                        </Button>
                        <Button 
                          variant="success"
                          size="sm"
                          onClick={() => handleSaveCustomDetachment(armyDetachment)}
                          title="Save as Custom Detachment"
                        >
                          💾
                        </Button>
                        {index > 0 && (
                          <Button 
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveDetachment(armyDetachment.detachmentId)}
                            title="Remove Detachment"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="detachment-description">{detachment.description}</p>
                    
                    {/* Visual Slot Display */}
                    <DetachmentSlots
                      detachment={detachment}
                      armyDetachment={armyDetachment}
                      armyList={armyList}
                      onUnitSelected={handleUnitSelected}
                      onDetachmentPrompt={handleDetachmentPrompt}
                      onUnitManagementOpen={handleUnitManagementOpen}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Points Limit Input Modal */}
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
              <Button variant="secondary" onClick={() => setShowPointsLimitInput(false)}>
                Cancel
              </Button>
              <Button 
                variant="success" 
                onClick={handlePointsLimitChange} 
                disabled={!tempPointsLimit.trim() || isNaN(parseInt(tempPointsLimit, 10)) || parseInt(tempPointsLimit, 10) <= 0}
              >
                Save
              </Button>
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
              <Button variant="secondary" onClick={() => setShowNameDialog(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleNameArmyList} disabled={!tempName.trim()}>
                Save
              </Button>
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
import React, { useState, useEffect } from 'react';
import { Button, Card } from './ui';
import { DataLoader } from '../utils/dataLoader';
import { CustomUnitStorage } from '../utils/customUnitStorage';
import type { Unit, CustomUnit, Army } from '../types/army';
import './UnitSelectionModal.css';

interface UnitSelectionModalProps {
  isOpen: boolean;
  roleId: string;
  roleName: string;
  armyList: Army;
  detachment: any;
  onUnitSelected: (unitId: string) => void;
  onClose: () => void;
}

const UnitSelectionModal: React.FC<UnitSelectionModalProps> = ({
  isOpen,
  roleId,
  roleName,
  armyList,
  detachment,
  onUnitSelected,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'base' | 'custom'>('base');
  const [availableBaseUnits, setAvailableBaseUnits] = useState<Unit[]>([]);
  const [availableCustomUnits, setAvailableCustomUnits] = useState<CustomUnit[]>([]);

  // Get available base units
  useEffect(() => {
    if (!isOpen) return;

    const allUnits = DataLoader.getUnits();
    const primaryFaction = armyList.faction;
    const armyAllegiance = armyList.allegiance;

    // Get the battlefield role data to convert between ID and type
    const selectedRole = DataLoader.getBattlefieldRoleById(roleId);
    if (!selectedRole) {
      setAvailableBaseUnits([]);
      return;
    }

    // Get the specific slot data to check for unit restrictions
    const slotData = detachment.slots.find((slot: any) => slot.roleId === roleId);
    const allowedUnitIds = slotData?.allowedUnits;

    const filteredUnits = allUnits.filter((unit: Unit) => {
      // If this slot has specific unit restrictions, only allow those units
      if (allowedUnitIds && allowedUnitIds.length > 0) {
        if (!allowedUnitIds.includes(unit.id)) {
          return false;
        }
      } else {
        // Otherwise, use the standard role-based filtering
        if (unit.battlefieldRole !== selectedRole.type) {
          return false;
        }
      }

      // Check allegiance compatibility
      if (unit.allegiance !== 'Universal' && unit.allegiance !== armyAllegiance) {
        return false;
      }

      // Check faction compatibility
      if (unit.faction && unit.faction !== 'universal') {
        // Direct faction match
        if (unit.faction === primaryFaction) {
          return true;
        }
        
        // Check if current faction is a subfaction of the unit's faction
        const currentFactionData = DataLoader.getFactionById(primaryFaction);
        if (currentFactionData?.parentFaction === unit.faction) {
          return true;
        }
        
        // Check if unit's faction is a parent of current faction
        const unitFactionData = DataLoader.getFactionById(unit.faction);
        if (unitFactionData?.isMainFaction && currentFactionData?.parentFaction === unit.faction) {
          return true;
        }
        
        return false;
      }

      // Check legion-specific restrictions
      if (unit.legionSpecific && unit.legionSpecific.length > 0) {
        // For now, allow all legion-specific units
        // In a full implementation, you'd check if the current faction is in the allowed list
        return true;
      }

      return true;
    });

    setAvailableBaseUnits(filteredUnits);
  }, [isOpen, roleId, armyList, detachment]);

  // Get available custom units
  useEffect(() => {
    if (!isOpen) return;

    const allCustomUnits = CustomUnitStorage.getAllCustomUnits();
    const primaryFaction = armyList.faction;
    const armyAllegiance = armyList.allegiance;

    // Get the battlefield role data to convert between ID and type
    const selectedRole = DataLoader.getBattlefieldRoleById(roleId);
    if (!selectedRole) {
      setAvailableCustomUnits([]);
      return;
    }

    // Get the specific slot data to check for unit restrictions
    const slotData = detachment.slots.find((slot: any) => slot.roleId === roleId);
    const allowedUnitIds = slotData?.allowedUnits;

    const filteredCustomUnits = Object.values(allCustomUnits).filter((customUnit: CustomUnit) => {
      // Get the base unit data for this custom unit
      const baseUnit = DataLoader.getUnitById(customUnit.baseUnitId);
      if (!baseUnit) return false;

      // If this slot has specific unit restrictions, only allow those units
      if (allowedUnitIds && allowedUnitIds.length > 0) {
        if (!allowedUnitIds.includes(customUnit.baseUnitId)) {
          return false;
        }
      } else {
        // Otherwise, use the standard role-based filtering
        if (baseUnit.battlefieldRole !== selectedRole.type) {
          return false;
        }
      }

      // Check allegiance compatibility
      if (baseUnit.allegiance !== 'Universal' && baseUnit.allegiance !== armyAllegiance) {
        return false;
      }

      // Check faction compatibility
      if (baseUnit.faction && baseUnit.faction !== 'universal') {
        // Direct faction match
        if (baseUnit.faction === primaryFaction) {
          return true;
        }
        
        // Check if current faction is a subfaction of the unit's faction
        const currentFactionData = DataLoader.getFactionById(primaryFaction);
        if (currentFactionData?.parentFaction === baseUnit.faction) {
          return true;
        }
        
        // Check if unit's faction is a parent of current faction
        const unitFactionData = DataLoader.getFactionById(baseUnit.faction);
        if (unitFactionData?.isMainFaction && currentFactionData?.parentFaction === baseUnit.faction) {
          return true;
        }
        
        return false;
      }

      // Check legion-specific restrictions
      if (baseUnit.legionSpecific && baseUnit.legionSpecific.length > 0) {
        // For now, allow all legion-specific units
        return true;
      }

      return true;
    });

    setAvailableCustomUnits(filteredCustomUnits);
  }, [isOpen, roleId, armyList, detachment]);

  const handleBaseUnitSelect = (unitId: string) => {
    onUnitSelected(unitId);
  };

  const handleCustomUnitSelect = (customUnit: CustomUnit) => {
    // For custom units, we need to create an ArmyUnit from the custom unit
    // This will be handled in the parent component
    onUnitSelected(`custom:${customUnit.id}`);
  };

  const getBaseUnitPoints = (unit: Unit) => {
    return unit.points;
  };

  const getCustomUnitPoints = (customUnit: CustomUnit) => {
    const baseUnit = DataLoader.getUnitById(customUnit.baseUnitId);
    if (!baseUnit) return 0;

    const upgradePoints = customUnit.upgrades.reduce((total, upgrade) => {
      return total + (upgrade.points * upgrade.count);
    }, 0);

    return baseUnit.points + upgradePoints;
  };

  if (!isOpen) return null;

  return (
    <div className="unit-selection-overlay" onClick={onClose}>
      <div className="unit-selection-content" onClick={(e) => e.stopPropagation()}>
        <div className="unit-selection-header">
          <h3>Select {roleName} Unit</h3>
          <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
        </div>
        
        <div className="unit-selection-tabs">
          <Button 
            variant={activeTab === 'base' ? 'warning' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('base')}
          >
            Base Units ({availableBaseUnits.length})
          </Button>
          <Button 
            variant={activeTab === 'custom' ? 'warning' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('custom')}
          >
            Custom Units ({availableCustomUnits.length})
          </Button>
        </div>

        <div className="unit-selection-body">
          {activeTab === 'base' && (
            <div className="base-units-tab">
              {availableBaseUnits.length > 0 ? (
                <div className="unit-list">
                  {availableBaseUnits.map((unit) => (
                    <Card
                      key={unit.id}
                      variant="default"
                      padding="lg"
                      interactive
                      className="unit-option"
                      onClick={() => handleBaseUnitSelect(unit.id)}
                    >
                      <div className="unit-info">
                        <div className="unit-name">{unit.name}</div>
                        <div className="unit-details">
                          <span className="unit-points">{getBaseUnitPoints(unit)} points</span>
                          {unit.faction && unit.faction !== 'universal' && (
                            <span className="unit-faction">
                              {unit.faction === 'legiones-astartes' ? 'Legion' : unit.faction}
                            </span>
                          )}
                          {unit.legionSpecific && unit.legionSpecific.length > 0 && (
                            <span className="unit-legion">Legion-specific</span>
                          )}
                        </div>
                      </div>
                      <div className="unit-description">{unit.description}</div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card variant="transparent" padding="lg" className="no-units">
                  <p>No {roleName} units available for your faction.</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="custom-units-tab">
              {availableCustomUnits.length > 0 ? (
                <div className="unit-list">
                  {availableCustomUnits.map((customUnit) => {
                    const baseUnit = DataLoader.getUnitById(customUnit.baseUnitId);
                    return (
                      <Card
                        key={customUnit.id}
                        variant="default"
                        padding="lg"
                        interactive
                        className="unit-option custom-unit"
                        onClick={() => handleCustomUnitSelect(customUnit)}
                      >
                        <div className="unit-info">
                          <div className="unit-name">
                            {customUnit.name}
                            <span className="custom-badge">Custom</span>
                          </div>
                          <div className="unit-details">
                            <span className="unit-points">{getCustomUnitPoints(customUnit)} points</span>
                            <span className="base-unit-name">Based on: {baseUnit?.name || customUnit.baseUnitId}</span>
                            {customUnit.upgrades.length > 0 && (
                              <span className="upgrades-count">{customUnit.upgrades.length} upgrade{customUnit.upgrades.length !== 1 ? 's' : ''}</span>
                            )}
                            {customUnit.primeAdvantages && customUnit.primeAdvantages.length > 0 && (
                              <span className="prime-advantages-count">{customUnit.primeAdvantages.length} prime advantage{customUnit.primeAdvantages.length !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                        <div className="unit-description">
                          {customUnit.description || baseUnit?.description || 'Custom unit configuration'}
                        </div>
                        {customUnit.description && (
                          <div className="custom-description">{customUnit.description}</div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card variant="transparent" padding="lg" className="no-units">
                  <p>No custom {roleName} units available for your faction.</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitSelectionModal; 
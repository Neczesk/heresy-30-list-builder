import React from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import type { Unit, Model, Weapon } from '../types/army';
import './UnitDetailModal.css';

interface UnitWithModels extends Unit {
  modelsWithData: Array<{
    model: Model;
    count: number;
  }>;
}

interface UnitDetailModalProps {
  unit: UnitWithModels;
  isOpen: boolean;
  onClose: () => void;
}

const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const getModelWeapons = (model: Model) => {
    const weapons: Array<{ weapon: Weapon; mount?: string; count?: number }> = [];
    
    model.weapons.forEach(weaponEntry => {
      const weapon = DataLoader.getWeaponById(weaponEntry.id);
      if (weapon) {
        weapons.push({
          weapon,
          mount: weaponEntry.mount,
          count: weaponEntry.count
        });
      }
    });
    
    return weapons;
  };

  const getModelWargear = (model: Model) => {
    return model.wargear.map(wargearId => {
      const wargear = DataLoader.getSpecialRuleById(wargearId);
      return wargear?.name || wargearId;
    });
  };

  const renderModelCharacteristics = (model: Model) => {
    const characteristics = model.characteristics;
    
    if (model.type === 'Vehicle') {
      const vehicleChars = characteristics as any;
      return (
        <table className="characteristics-table">
          <thead>
            <tr>
              <th>M</th>
              <th>BS</th>
              <th colSpan={3}>Vehicle Armor</th>
              <th>HP</th>
              <th>TC</th>
            </tr>
            <tr>
              <th></th>
              <th></th>
              <th>FA</th>
              <th>SA</th>
              <th>RA</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{vehicleChars.movement}"</td>
              <td>{vehicleChars.ballisticSkill}+</td>
              <td>{vehicleChars.frontArmour}+</td>
              <td>{vehicleChars.sideArmour}+</td>
              <td>{vehicleChars.rearArmour}+</td>
              <td>{vehicleChars.hullPoints}</td>
              <td>{vehicleChars.transportCapacity || '-'}</td>
            </tr>
          </tbody>
        </table>
      );
    } else {
      const infantryChars = characteristics as any;
      return (
        <table className="characteristics-table">
          <thead>
            <tr>
              <th>M</th>
              <th>WS</th>
              <th>BS</th>
              <th>S</th>
              <th>T</th>
              <th>W</th>
              <th>I</th>
              <th>A</th>
              <th>Ld</th>
              <th>Sv</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{infantryChars.movement}"</td>
              <td>{infantryChars.weaponSkill}+</td>
              <td>{infantryChars.ballisticSkill}+</td>
              <td>{infantryChars.strength}</td>
              <td>{infantryChars.toughness}</td>
              <td>{infantryChars.wounds}</td>
              <td>{infantryChars.initiative}</td>
              <td>{infantryChars.attacks}</td>
              <td>{infantryChars.leadership}</td>
              <td>{infantryChars.armourSave}+</td>
            </tr>
          </tbody>
        </table>
      );
    }
  };

  const renderWeaponTable = (weapons: Array<{ weapon: Weapon; mount?: string; count?: number }>) => {
    if (weapons.length === 0) {
      return <p>No weapons available.</p>;
    }

    const isVehicle = unit.modelsWithData.some(modelData => modelData.model.type === 'Vehicle');

    return (
      <table className="weapons-table">
        <thead>
          <tr>
            <th>Weapon</th>
            {isVehicle && <th>Mount</th>}
            <th>Type</th>
            <th>Range</th>
            <th>Firepower</th>
            <th>S</th>
            <th>AP</th>
            <th>D</th>
            <th>Special Rules</th>
            <th>Traits</th>
          </tr>
        </thead>
        <tbody>
          {weapons.map(({ weapon, mount, count }, index) => {
            const displayName = count && count > 1 ? `${weapon.name} x${count}` : weapon.name;
            
            if (weapon.type === 'ranged') {
              const rangedWeapon = weapon as any;
              return (
                <tr key={`${weapon.id}-${index}`}>
                  <td>{displayName}</td>
                  {isVehicle && <td>{mount || '-'}</td>}
                  <td>Ranged</td>
                  <td>{rangedWeapon.range}"</td>
                  <td>{rangedWeapon.firepower}</td>
                  <td>{rangedWeapon.rangedStrength}</td>
                  <td>{rangedWeapon.ap}</td>
                  <td>{rangedWeapon.damage}</td>
                  <td>{rangedWeapon.specialRules?.join(', ') || '-'}</td>
                  <td>{rangedWeapon.traits?.join(', ') || '-'}</td>
                </tr>
              );
            } else {
              const meleeWeapon = weapon as any;
              return (
                <tr key={`${weapon.id}-${index}`}>
                  <td>{displayName}</td>
                  {isVehicle && <td>{mount || '-'}</td>}
                  <td>Melee</td>
                  <td>-</td>
                  <td>-</td>
                  <td>{meleeWeapon.strengthModifier || '-'}</td>
                  <td>{meleeWeapon.ap}</td>
                  <td>{meleeWeapon.damage}</td>
                  <td>{meleeWeapon.specialRules?.join(', ') || '-'}</td>
                  <td>{meleeWeapon.traits?.join(', ') || '-'}</td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="unit-detail-modal-overlay" onClick={onClose}>
      <div className="unit-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{unit.name}</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
        </div>

        <div className="modal-content">
          <div className="unit-overview">
            <div className="unit-info-grid">
              <div className="info-item">
                <span className="info-label">Battlefield Role:</span>
                <span className="info-value">{unit.battlefieldRole}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Unit Size:</span>
                <span className="info-value">{unit.minSize}-{unit.maxSize} models</span>
              </div>
              <div className="info-item">
                <span className="info-label">Base Points:</span>
                <span className="info-value">{unit.points} pts</span>
              </div>
              <div className="info-item">
                <span className="info-label">Base Size:</span>
                <span className="info-value">{unit.baseSize} models</span>
              </div>
            </div>
            
            <div className="unit-description">
              <h3>Description</h3>
              <p>{unit.description}</p>
            </div>
          </div>

          <div className="models-section">
            <h3>Models</h3>
            {unit.modelsWithData.map((modelData) => (
              <div key={modelData.model.id} className="model-section">
                <div className="model-header">
                  <h4>{modelData.count}x {modelData.model.name}</h4>
                  <div className="model-type-badge">
                    {modelData.model.type} - {modelData.model.subType}
                  </div>
                </div>

                <div className="model-content">
                  <div className="characteristics-section">
                    <h5>Characteristics</h5>
                    {renderModelCharacteristics(modelData.model)}
                  </div>

                  <div className="weapons-section">
                    <h5>Available Weapons</h5>
                    {renderWeaponTable(getModelWeapons(modelData.model))}
                  </div>

                  {modelData.model.wargear.length > 0 && (
                    <div className="wargear-section">
                      <h5>Available Wargear</h5>
                      <div className="wargear-list">
                        {getModelWargear(modelData.model).map((wargearId, wIndex) => (
                          <span key={wIndex} className="wargear-item">
                            {wargearId}
                            {wIndex < getModelWargear(modelData.model).length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {modelData.model.specialRules.length > 0 && (
                    <div className="special-rules-section">
                      <h5>Special Rules</h5>
                      <div className="special-rules-list">
                        {modelData.model.specialRules.map((ruleId, rIndex) => (
                          <span key={rIndex} className="special-rule-item">
                            {ruleId}
                            {rIndex < modelData.model.specialRules.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {unit.specialRules.length > 0 && (
            <div className="unit-special-rules">
              <h3>Unit Special Rules</h3>
              <div className="special-rules-list">
                {unit.specialRules.map((ruleId, index) => (
                  <span key={index} className="special-rule-item">
                    {ruleId}
                    {index < unit.specialRules.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {unit.traits.length > 0 && (
            <div className="unit-traits">
              <h3>Unit Traits</h3>
              <div className="traits-list">
                {unit.traits.map((trait, index) => (
                  <span key={index} className="trait-tag">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitDetailModal; 
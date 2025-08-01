import React, { useState, useEffect } from 'react';
import { DataLoader } from '../utils/dataLoader';
import type { Unit, Model, Weapon, RangedWeapon, MeleeWeapon } from '../types/army';
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
  const [allWeapons, setAllWeapons] = useState<Weapon[]>([]);

  useEffect(() => {
    if (isOpen) {
      const weapons = DataLoader.getWeapons();
      setAllWeapons(weapons);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getModelWeapons = (model: Model) => {
    return model.weapons.map(weaponRef => {
      const weapon = allWeapons.find(w => w.id === weaponRef.id);
      return {
        weapon,
        mount: weaponRef.mount,
        count: weaponRef.count || 1
      };
    }).filter(item => item.weapon).map(item => ({
      weapon: item.weapon!,
      mount: item.mount,
      count: item.count
    }));
  };

  const getModelWargear = (model: Model) => {
    return model.wargear.map(wargearId => {
      // For now, we'll just show the ID. In a full implementation,
      // you'd load wargear data and show names
      return wargearId;
    });
  };

  const renderModelCharacteristics = (model: Model) => {
    if ('movement' in model.characteristics && 'strength' in model.characteristics) {
      // Infantry model
      const chars = model.characteristics;
      return (
        <table className="characteristics-table">
          <thead>
            <tr>
              <th>M</th>
              <th>S</th>
              <th>T</th>
              <th>I</th>
              <th>A</th>
              <th>W</th>
              <th>WS</th>
              <th>BS</th>
              <th>Ld</th>
              <th>Wp</th>
              <th>Cl</th>
              <th>Int</th>
              <th>Sv</th>
              <th>Inv</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{chars.movement}</td>
              <td>{chars.strength}</td>
              <td>{chars.toughness}</td>
              <td>{chars.initiative}</td>
              <td>{chars.attacks}</td>
              <td>{chars.wounds}</td>
              <td>{chars.weaponSkill}</td>
              <td>{chars.ballisticSkill}</td>
              <td>{chars.leadership}</td>
              <td>{chars.willpower}</td>
              <td>{chars.cool}</td>
              <td>{chars.intelligence}</td>
              <td>{chars.armourSave}</td>
              <td>{chars.invulnerableSave || '-'}</td>
            </tr>
          </tbody>
        </table>
      );
    } else {
      // Vehicle model
      const chars = model.characteristics;
      return (
        <table className="characteristics-table">
          <thead>
            <tr>
              <th>M</th>
              <th>BS</th>
              <th>Front</th>
              <th>Side</th>
              <th>Rear</th>
              <th>HP</th>
              <th>Capacity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{chars.movement}</td>
              <td>{chars.ballisticSkill}</td>
              <td>{chars.frontArmour}</td>
              <td>{chars.sideArmour}</td>
              <td>{chars.rearArmour}</td>
              <td>{chars.hullPoints}</td>
              <td>{chars.transportCapacity || '-'}</td>
            </tr>
          </tbody>
        </table>
      );
    }
  };

  const renderWeaponTable = (weapons: Array<{ weapon: Weapon; mount?: string; count?: number }>) => {
    const validWeapons = weapons.filter(w => w.weapon);
    const rangedWeapons = validWeapons.filter(w => w.weapon.type === 'ranged') as Array<{ weapon: RangedWeapon; mount?: string; count?: number }>;
    const meleeWeapons = validWeapons.filter(w => w.weapon.type === 'melee') as Array<{ weapon: MeleeWeapon; mount?: string; count?: number }>;

    return (
      <div className="weapons-section">
        {rangedWeapons.length > 0 && (
          <div className="weapon-type-section">
            <h4>Ranged Weapons</h4>
            <table className="weapon-table">
              <thead>
                <tr>
                  <th>Weapon</th>
                  <th>Range</th>
                  <th>Firepower</th>
                  <th>Strength</th>
                  <th>AP</th>
                  <th>Damage</th>
                  <th>Special Rules</th>
                  <th>Traits</th>
                </tr>
              </thead>
              <tbody>
                {rangedWeapons.map((weaponData, index) => {
                  const weapon = weaponData.weapon;
                  return (
                    <tr key={index}>
                      <td className="weapon-name">
                        {weapon.name}
                        {weaponData.mount && <span className="weapon-mount"> ({weaponData.mount})</span>}
                        {weaponData.count && weaponData.count > 1 && <span className="weapon-count"> x{weaponData.count}</span>}
                      </td>
                      <td>{weapon.range || '-'}</td>
                      <td>{weapon.firepower || '-'}</td>
                      <td>{weapon.rangedStrength || '-'}</td>
                      <td>{weapon.ap || '-'}</td>
                      <td>{weapon.damage || '-'}</td>
                      <td>{weapon.specialRules?.join(', ') || '-'}</td>
                      <td>{weapon.traits?.join(', ') || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meleeWeapons.length > 0 && (
          <div className="weapon-type-section">
            <h4>Melee Weapons</h4>
            <table className="weapon-table">
              <thead>
                <tr>
                  <th>Weapon</th>
                  <th>Attack Mod</th>
                  <th>Strength Mod</th>
                  <th>AP</th>
                  <th>Damage</th>
                  <th>Special Rules</th>
                  <th>Traits</th>
                </tr>
              </thead>
              <tbody>
                {meleeWeapons.map((weaponData, index) => {
                  const weapon = weaponData.weapon;
                  return (
                    <tr key={index}>
                      <td className="weapon-name">
                        {weapon.name}
                        {weaponData.mount && <span className="weapon-mount"> ({weaponData.mount})</span>}
                        {weaponData.count && weaponData.count > 1 && <span className="weapon-count"> x{weaponData.count}</span>}
                      </td>
                      <td>{weapon.attackModifier}</td>
                      <td>{weapon.strengthModifier}</td>
                      <td>{weapon.ap || '-'}</td>
                      <td>{weapon.damage}</td>
                      <td>{weapon.specialRules?.join(', ') || '-'}</td>
                      <td>{weapon.traits?.join(', ') || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="unit-detail-modal-overlay" onClick={onClose}>
      <div className="unit-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{unit.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
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
                  <span key={index} className="trait-item">
                    {trait}
                    {index < unit.traits.length - 1 ? ', ' : ''}
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
import React from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import styles from './UnitViewer.module.css';
import type { Unit, Model, RangedWeapon, MeleeWeapon, ArmyUnit } from '../types/army';

interface UnitViewerProps {
  unit: Unit;
  armyUnit?: ArmyUnit; // Optional army unit instance for modifications
  onClose?: () => void;
}

export const UnitViewer: React.FC<UnitViewerProps> = ({ unit, armyUnit, onClose }) => {

  const modelCompositions = armyUnit 
    ? DataLoader.getModelsForUnitInstance(unit.id, armyUnit)
    : DataLoader.getModelsForUnit(unit.id);
  

  
  // Calculate actual size from models
  const actualSize = modelCompositions.reduce((total, { count }) => total + count, 0);
  
  // Format faction name from kebab-case to Title Case
  const formatFactionName = (factionId: string): string => {
    return factionId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const formatTypeSubtypes = (modelCompositions: { model: Model; count: number }[]): string => {
    const typeGroups: { [key: string]: string[] } = {};
    
    modelCompositions.forEach(({ model }) => {
      if (!typeGroups[model.type]) {
        typeGroups[model.type] = [];
      }
      if (!typeGroups[model.type].includes(model.subType)) {
        typeGroups[model.type].push(model.subType);
      }
    });
    
    return Object.entries(typeGroups)
      .map(([type, subtypes]) => `${type}(${subtypes.join(', ')})`)
      .join(', ');
  };

  const renderCharacteristicsTable = (modelCompositions: { model: Model; count: number }[]) => {
    const isVehicle = modelCompositions.some(({ model }) => model.type === 'Vehicle');
    
    if (isVehicle) {
      return (
        <table className={styles.characteristicsTable}>
          <thead>
            <tr>
              <th>Model</th>
              <th>M</th>
              <th>BS</th>
              <th colSpan={3} className={styles.groupHeader}>Vehicle Armor</th>
              <th>HP</th>
              <th>TC</th>
            </tr>
            <tr>
              <th></th>
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
            {modelCompositions.map(({ model, count }) => {
              const characteristics = model.characteristics as any;
              const displayName = count > 1 ? `${model.name} x${count}` : model.name;
              return (
                <tr key={model.id}>
                  <td>{displayName}</td>
                  <td>{characteristics.movement}"</td>
                  <td>{characteristics.ballisticSkill}+</td>
                  <td>{characteristics.frontArmour}+</td>
                  <td>{characteristics.sideArmour}+</td>
                  <td>{characteristics.rearArmour}+</td>
                  <td>{characteristics.hullPoints}</td>
                  <td>{characteristics.transportCapacity || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    } else {
      return (
        <table className={styles.characteristicsTable}>
          <thead>
            <tr>
              <th>Model</th>
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
            {modelCompositions.map(({ model, count }) => {
              const characteristics = model.characteristics as any;
              const displayName = count > 1 ? `${model.name} x${count}` : model.name;
              return (
                <tr key={model.id}>
                  <td>{displayName}</td>
                  <td>{characteristics.movement}"</td>
                  <td>{characteristics.weaponSkill}+</td>
                  <td>{characteristics.ballisticSkill}+</td>
                  <td>{characteristics.strength}</td>
                  <td>{characteristics.toughness}</td>
                  <td>{characteristics.wounds}</td>
                  <td>{characteristics.initiative}</td>
                  <td>{characteristics.attacks}</td>
                  <td>{characteristics.leadership}</td>
                  <td>{characteristics.armourSave}+</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
  };

  const renderRangedWeaponsTable = (modelCompositions: { model: Model; count: number }[]) => {
    const weaponMap = new Map<string, { weaponId: string; models: string[]; weapon: RangedWeapon | undefined }>();
    
    modelCompositions.forEach(({ model, count }) => {
      model.weapons?.forEach(weaponEntry => {
        const weapon = DataLoader.getWeaponById(weaponEntry.id);
        const key = weaponEntry.id;
        
        // Only include ranged weapons
        if (weapon && DataLoader.isRangedWeapon(weapon)) {
          if (weaponMap.has(key)) {
            const existing = weaponMap.get(key)!;
            existing.models.push(`${model.name}${count > 1 ? ` x${count}` : ''}`);
          } else {
            weaponMap.set(key, {
              weaponId: weaponEntry.id,
              models: [`${model.name}${count > 1 ? ` x${count}` : ''}`],
              weapon: weapon as RangedWeapon
            });
          }
        }
      });
    });
    
    if (weaponMap.size === 0) {
      return <p>No ranged weapons available.</p>;
    }
    
    return (
      <table className={styles.rangedWeaponsTable}>
        <thead>
          <tr>
            <th>Models</th>
            <th>Weapon</th>
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
          {Array.from(weaponMap.values()).map(({ weaponId, models, weapon }, index) => {
            if (!weapon) {
              return (
                <tr key={`${weaponId}-${index}`}>
                  <td>{models.join(', ')}</td>
                  <td>{weaponId}</td>
                  <td colSpan={7}>Weapon not found</td>
                </tr>
              );
            }
            
            return (
              <tr key={`${weaponId}-${index}`}>
                <td>{models.join(', ')}</td>
                <td>{weapon.name}</td>
                <td>{weapon.range}"</td>
                <td>{weapon.firepower}</td>
                <td>{weapon.rangedStrength}</td>
                <td>{weapon.ap}</td>
                <td>{weapon.damage}</td>
                <td>{weapon.specialRules?.join(', ') || '-'}</td>
                <td>{weapon.traits?.join(', ') || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderMeleeWeaponsTable = (modelCompositions: { model: Model; count: number }[]) => {
    const weaponMap = new Map<string, { weaponId: string; models: string[]; weapon: MeleeWeapon | undefined }>();
    
    modelCompositions.forEach(({ model, count }) => {
      model.weapons?.forEach(weaponEntry => {
        const weapon = DataLoader.getWeaponById(weaponEntry.id);
        const key = weaponEntry.id;
        
        // Only include melee weapons
        if (weapon && !DataLoader.isRangedWeapon(weapon)) {
          if (weaponMap.has(key)) {
            const existing = weaponMap.get(key)!;
            existing.models.push(`${model.name}${count > 1 ? ` x${count}` : ''}`);
          } else {
            weaponMap.set(key, {
              weaponId: weaponEntry.id,
              models: [`${model.name}${count > 1 ? ` x${count}` : ''}`],
              weapon: weapon as MeleeWeapon
            });
          }
        }
      });
    });
    
    if (weaponMap.size === 0) {
      return <p>No melee weapons available.</p>;
    }
    
    return (
      <table className={styles.meleeWeaponsTable}>
        <thead>
          <tr>
            <th>Models</th>
            <th>Weapon</th>
            <th>Attack Modifier</th>
            <th>Strength Modifier</th>
            <th>AP</th>
            <th>D</th>
            <th>Special Rules</th>
            <th>Traits</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(weaponMap.values()).map(({ weaponId, models, weapon }, index) => {
            if (!weapon) {
              return (
                <tr key={`${weaponId}-${index}`}>
                  <td>{models.join(', ')}</td>
                  <td>{weaponId}</td>
                  <td colSpan={6}>Weapon not found</td>
                </tr>
              );
            }
            
            return (
              <tr key={`${weaponId}-${index}`}>
                <td>{models.join(', ')}</td>
                <td>{weapon.name}</td>
                <td>{weapon.attackModifier || '-'}</td>
                <td>{weapon.strengthModifier || '-'}</td>
                <td>{weapon.ap}</td>
                <td>{weapon.damage}</td>
                <td>{weapon.specialRules?.join(', ') || '-'}</td>
                <td>{weapon.traits?.join(', ') || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderSpecialRulesTable = (modelCompositions: { model: Model; count: number }[]) => {
    const rulesMap = new Map<string, { ruleId: string; models: string[]; rule: any }>();
    
    modelCompositions.forEach(({ model, count }) => {
      model.specialRules?.forEach(ruleId => {
        const rule = DataLoader.getSpecialRuleById(ruleId);
        const key = ruleId;
        
        if (rulesMap.has(key)) {
          const existing = rulesMap.get(key)!;
          existing.models.push(`${model.name}${count > 1 ? ` x${count}` : ''}`);
        } else {
          rulesMap.set(key, {
            ruleId: ruleId,
            models: [`${model.name}${count > 1 ? ` x${count}` : ''}`],
            rule
          });
        }
      });
    });
    
    if (rulesMap.size === 0) {
      return <p>No special rules available.</p>;
    }
    
    return (
      <table className={styles.specialRulesTable}>
        <thead>
          <tr>
            <th>Models</th>
            <th>Rule</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(rulesMap.values()).map(({ ruleId, models, rule }, index) => {
            return (
              <tr key={`${ruleId}-${index}`}>
                <td>{models.join(', ')}</td>
                <td>{rule?.name || ruleId}</td>
                <td>{rule?.shortText || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderWargearTable = (modelCompositions: { model: Model; count: number }[]) => {
    const wargearMap = new Map<string, { wargearId: string; models: string[]; wargear: any }>();
    
    modelCompositions.forEach(({ model, count }) => {
      model.wargear?.forEach(wargearId => {
        const wargear = DataLoader.getSpecialRuleById(wargearId);
        const key = wargearId;
        
        if (wargearMap.has(key)) {
          const existing = wargearMap.get(key)!;
          existing.models.push(`${model.name}${count > 1 ? ` x${count}` : ''}`);
        } else {
          wargearMap.set(key, {
            wargearId: wargearId,
            models: [`${model.name}${count > 1 ? ` x${count}` : ''}`],
            wargear
          });
        }
      });
    });
    
    if (wargearMap.size === 0) {
      return <p>No wargear available.</p>;
    }
    
    return (
      <table className={styles.wargearTable}>
        <thead>
          <tr>
            <th>Models</th>
            <th>Wargear</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(wargearMap.values()).map(({ wargearId, models, wargear }, index) => {
            return (
              <tr key={`${wargearId}-${index}`}>
                <td>{models.join(', ')}</td>
                <td>{wargear?.name || wargearId}</td>
                <td>{wargear?.shortText || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className={styles.unitViewer}>
      <div className={styles.unitViewerHeader}>
        <h2>{unit.name}</h2>
        {onClose && (
          <Button variant="secondary" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>
      
      <div className={styles.unitViewerContent}>
        <div className={styles.unitInfo}>
          <p><strong>Faction:</strong> {formatFactionName(unit.faction)}</p>
          <p><strong>Battlefield Role:</strong> {unit.battlefieldRole}</p>
          <p><strong>Size:</strong> {actualSize} models</p>
          <p><strong>Base Points:</strong> {unit.points}</p>
          <p><strong>Types:</strong> {formatTypeSubtypes(modelCompositions)}</p>
          <p><strong>Description:</strong> {unit.description}</p>
        </div>

        <div className={styles.unitSection}>
          <h3>Characteristics</h3>
          {renderCharacteristicsTable(modelCompositions)}
        </div>

        <div className={styles.unitSection}>
          <h3>Ranged Weapons</h3>
          {renderRangedWeaponsTable(modelCompositions)}
        </div>

        <div className={styles.unitSection}>
          <h3>Melee Weapons</h3>
          {renderMeleeWeaponsTable(modelCompositions)}
        </div>

        <div className={styles.unitSection}>
          <h3>Special Rules</h3>
          {renderSpecialRulesTable(modelCompositions)}
        </div>

        <div className={styles.unitSection}>
          <h3>Wargear</h3>
          {renderWargearTable(modelCompositions)}
        </div>

        {unit.traits && unit.traits.length > 0 && (
          <div className={styles.unitSection}>
            <h3>Traits</h3>
            <div className={styles.traitsList}>
              {unit.traits.map((trait, index) => (
                <span key={index} className={styles.traitTag}>
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {armyUnit?.primeAdvantages && armyUnit.primeAdvantages.length > 0 && (
          <div className={styles.unitSection}>
            <h3>Prime Advantages</h3>
            <div className={styles.primeAdvantagesList}>
              {armyUnit.primeAdvantages.map((advantage, index) => (
                <div key={index} className={styles.primeAdvantageItem}>
                  <div className={styles.advantageName}>{advantage.description}</div>
                  <div className={styles.advantageEffect}>{advantage.effect}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
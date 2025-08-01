import React from 'react';
import { DataLoader } from '../utils/dataLoader';
import type { Unit, Model, Weapon, RangedWeapon, MeleeWeapon, ArmyUnit } from '../types/army';
import './UnitViewer.css';

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
        <table className="characteristics-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>M</th>
              <th>BS</th>
              <th colSpan={3} className="group-header">Vehicle Armor</th>
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
        <table className="characteristics-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>M</th>
              <th>S</th>
              <th>T</th>
              <th>I</th>
              <th>A</th>
              <th>W</th>
              <th>WS</th>
              <th>BS</th>
              <th colSpan={4} className="group-header">Mental Stats</th>
              <th>Sv</th>
              <th>Inv</th>
            </tr>
            <tr>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th>Ld</th>
              <th>Wp</th>
              <th>Cl</th>
              <th>Int</th>
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
                  <td>{characteristics.strength}</td>
                  <td>{characteristics.toughness}</td>
                  <td>{characteristics.initiative}</td>
                  <td>{characteristics.attacks}</td>
                  <td>{characteristics.wounds}</td>
                  <td>{characteristics.weaponSkill}+</td>
                  <td>{characteristics.ballisticSkill}+</td>
                  <td>{characteristics.leadership}</td>
                  <td>{characteristics.willpower}</td>
                  <td>{characteristics.cool}</td>
                  <td>{characteristics.intelligence}</td>
                  <td>{characteristics.armourSave}+</td>
                  <td>{characteristics.invulnerableSave ? `${characteristics.invulnerableSave}+` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
  };

  const renderRangedWeaponsTable = (modelCompositions: { model: Model; count: number }[]) => {
    const weaponMap = new Map<string, { weapon: RangedWeapon; count: number; mount?: string }>();
    const isVehicle = modelCompositions.some(({ model }) => model.type === 'Vehicle');
    
    // Use the new weapon count calculation if armyUnit is provided
    if (armyUnit) {
      const weaponCounts = DataLoader.calculateWeaponCounts(unit.id, armyUnit);
      
      Object.entries(weaponCounts).forEach(([key, weaponData]) => {
        const weapon = DataLoader.getWeaponById(weaponData.weaponId);
        if (weapon && DataLoader.isRangedWeapon(weapon) && weaponData.count > 0) {
          // Use mount information from the weapon data
          const mount = weaponData.mount;
          // For non-vehicle units, use weapon ID as key. For vehicle units, use the full key with mount
          const mapKey = mount ? key : weaponData.weaponId;
          weaponMap.set(mapKey, { weapon: weapon as RangedWeapon, count: weaponData.count, mount });
        }
      });
    } else {
      // Fall back to the old method for backward compatibility
      modelCompositions.forEach(({ model, count }) => {
        // Handle new weapon structure with mount locations (RANGED)
        if (Array.isArray(model.weapons) && model.weapons.length > 0 && typeof model.weapons[0] === 'object' && 'id' in model.weapons[0]) {
          // New structure: Array of { id: string, mount?: string, count?: number }
          (model.weapons as Array<{ id: string; mount?: string; count?: number }>).forEach(weaponEntry => {
            const weapon = DataLoader.getWeaponById(weaponEntry.id);
            if (weapon && DataLoader.isRangedWeapon(weapon)) {
              const key = `${weapon.id}-${weaponEntry.mount || 'default'}`;
              const mount = weaponEntry.mount;
              const weaponCount = weaponEntry.count || 1;
              if (weaponMap.has(key)) {
                const existing = weaponMap.get(key)!;
                existing.count += count * weaponCount;
              } else {
                weaponMap.set(key, { weapon: weapon as RangedWeapon, count: count * weaponCount, mount });
              }
            }
          });
        } else {
          // Old structure: Array of strings (RANGED)
          const weapons = (model.weapons as unknown as string[]).map(weaponId => DataLoader.getWeaponById(weaponId)).filter(weapon => weapon !== undefined) as Weapon[];
          const rangedWeapons = weapons.filter(weapon => DataLoader.isRangedWeapon(weapon)) as RangedWeapon[];
          rangedWeapons.forEach(weapon => {
            const key = weapon.id;
            const mount = undefined;
            if (weaponMap.has(key)) {
              const existing = weaponMap.get(key)!;
              existing.count += count;
              // Keep the first mount found for this weapon
              if (!existing.mount && mount) {
                existing.mount = mount;
              }
            } else {
              weaponMap.set(key, { weapon, count, mount });
            }
          });
        }
      });
    }

    if (weaponMap.size === 0) {
      return null;
    }

    return (
      <table className="weapons-table">
        <thead>
          <tr>
            <th>Models</th>
            <th>Weapon</th>
            {isVehicle && <th>Mount</th>}
            <th>R</th>
            <th>FP</th>
            <th>S</th>
            <th>AP</th>
            <th>D</th>
            <th>Traits</th>
            <th>Special Rules</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(weaponMap.values()).map(({ weapon, count, mount }, index) => {
            // Use the count that was already calculated for this weapon/mount combination
            const displayName = count > 1 ? `${weapon.name} x${count}` : weapon.name;
            // Check if weapon has multiple profiles
            if (weapon.profiles && weapon.profiles.length > 0) {
              // Create a group header row followed by profile rows
              const rows = [];
              
              // Add header row for the weapon group
              rows.push(
                <tr key={`${weapon.id}-${index}-header`} className="weapon-group-header">
                  <td>{count > 1 ? `${count} models` : '1 model'}</td>
                  <td colSpan={isVehicle ? 8 : 7}><strong>{displayName}</strong></td>
                </tr>
              );
              
              // Add each profile as a separate row
              weapon.profiles.forEach((profile, profileIndex) => {
                rows.push(
                  <tr key={`${weapon.id}-${index}-${profileIndex}`} className="weapon-profile-row">
                    <td></td>
                    <td>{profile.name}</td>
                    {isVehicle && <td>{mount || '-'}</td>}
                    <td>{profile.range}"</td>
                    <td>{profile.firepower}</td>
                    <td>{profile.rangedStrength}</td>
                    <td>{profile.ap}</td>
                    <td>{profile.damage}</td>
                    <td>
                      {profile.traits && profile.traits.length > 0 
                        ? profile.traits.join(', ')
                        : '-'
                      }
                    </td>
                    <td>
                      {profile.specialRules.length > 0 
                        ? profile.specialRules.map(ruleId => {
                            const rule = DataLoader.getSpecialRuleById(ruleId);
                            const value = profile.specialRuleValues?.[ruleId];
                            const ruleDisplayName = value ? `${rule?.name || ruleId} (${value})` : rule?.name || ruleId;
                            return ruleDisplayName;
                          }).join(', ')
                        : '-'
                      }
                    </td>
                  </tr>
                );
              });
              
              return rows;
            } else {
              // Single profile weapon (backward compatibility)
              return (
                <tr key={`${weapon.id}-${index}`}>
                  <td>{count > 1 ? `${count} models` : '1 model'}</td>
                  <td>{displayName}</td>
                  {isVehicle && <td>{mount || '-'}</td>}
                  <td>{weapon.range}"</td>
                  <td>{weapon.firepower}</td>
                  <td>{weapon.rangedStrength}</td>
                  <td>{weapon.ap}</td>
                  <td>{weapon.damage}</td>
                  <td>
                    {weapon.traits && weapon.traits.length > 0 
                      ? weapon.traits.join(', ')
                      : '-'
                    }
                  </td>
                  <td>
                    {weapon.specialRules && weapon.specialRules.length > 0 
                      ? weapon.specialRules.map(ruleId => {
                          const rule = DataLoader.getSpecialRuleById(ruleId);
                          const value = weapon.specialRuleValues?.[ruleId];
                          const ruleDisplayName = value ? `${rule?.name || ruleId} (${value})` : rule?.name || ruleId;
                          return ruleDisplayName;
                        }).join(', ')
                      : '-'
                    }
                  </td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    );
  };

  const renderMeleeWeaponsTable = (modelCompositions: { model: Model; count: number }[]) => {
    const weaponMap = new Map<string, { weapon: MeleeWeapon; count: number; mount?: string }>();
    const isVehicle = modelCompositions.some(({ model }) => model.type === 'Vehicle');
    
    // Use the new weapon count calculation if armyUnit is provided
    if (armyUnit) {
      const weaponCounts = DataLoader.calculateWeaponCounts(unit.id, armyUnit);
      
      Object.entries(weaponCounts).forEach(([key, weaponData]) => {
        const weapon = DataLoader.getWeaponById(weaponData.weaponId);
        if (weapon && !DataLoader.isRangedWeapon(weapon) && weaponData.count > 0) {
          // Use mount information from the weapon data
          const mount = weaponData.mount;
          // For non-vehicle units, use weapon ID as key. For vehicle units, use the full key with mount
          const mapKey = mount ? key : weaponData.weaponId;
          weaponMap.set(mapKey, { weapon: weapon as MeleeWeapon, count: weaponData.count, mount });
        }
      });
    } else {
      // Fall back to the old method for backward compatibility
      modelCompositions.forEach(({ model, count }) => {
        // Handle new weapon structure with mount locations (MELEE)
        if (Array.isArray(model.weapons) && model.weapons.length > 0 && typeof model.weapons[0] === 'object' && 'id' in model.weapons[0]) {
          // New structure: Array of { id: string, mount?: string, count?: number }
          (model.weapons as Array<{ id: string; mount?: string; count?: number }>).forEach(weaponEntry => {
            const weapon = DataLoader.getWeaponById(weaponEntry.id);
            if (weapon && !DataLoader.isRangedWeapon(weapon)) {
              const key = `${weapon.id}-${weaponEntry.mount || 'default'}`;
              const mount = weaponEntry.mount;
              const weaponCount = weaponEntry.count || 1;
              if (weaponMap.has(key)) {
                const existing = weaponMap.get(key)!;
                existing.count += count * weaponCount;
              } else {
                weaponMap.set(key, { weapon: weapon as MeleeWeapon, count: count * weaponCount, mount });
              }
            }
          });
        } else {
          // Old structure: Array of strings (MELEE)
          const weapons = (model.weapons as unknown as string[]).map(weaponId => DataLoader.getWeaponById(weaponId)).filter(weapon => weapon !== undefined) as Weapon[];
          const meleeWeapons = weapons.filter(weapon => !DataLoader.isRangedWeapon(weapon)) as MeleeWeapon[];
          meleeWeapons.forEach(weapon => {
            const key = weapon.id;
            const mount = undefined;
            if (weaponMap.has(key)) {
              const existing = weaponMap.get(key)!;
              existing.count += count;
              // Keep the first mount found for this weapon
              if (!existing.mount && mount) {
                existing.mount = mount;
              }
            } else {
              weaponMap.set(key, { weapon, count, mount });
            }
          });
        }
      });
    }

    if (weaponMap.size === 0) {
      return null;
    }

    return (
      <table className="weapons-table">
        <thead>
          <tr>
            <th>Models</th>
            <th>Weapon</th>
            {isVehicle && <th>Mount</th>}
            <th>IM</th>
            <th>AM</th>
            <th>S</th>
            <th>AP</th>
            <th>D</th>
            <th>Traits</th>
            <th>Special Rules</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(weaponMap.values()).map(({ weapon, count, mount }, index) => {
            // Use the count that was already calculated for this weapon/mount combination
            const displayName = count > 1 ? `${weapon.name} x${count}` : weapon.name;
            
            return (
            <tr key={`${weapon.id}-${index}`}>
              <td>{count > 1 ? `${count} models` : '1 model'}</td>
              <td>{displayName}</td>
              {isVehicle && <td>{mount || '-'}</td>}
              <td>{weapon.initiativeModifier === "I" ? "I" : (typeof weapon.initiativeModifier === 'number' && weapon.initiativeModifier > 0 ? `+${weapon.initiativeModifier}` : weapon.initiativeModifier)}</td>
              <td>{weapon.attackModifier === "A" ? "A" : `${typeof weapon.attackModifier === 'number' && weapon.attackModifier > 0 ? '+' : ''}${weapon.attackModifier}`}</td>
              <td>{weapon.strengthModifier === "S" ? "S" : `${typeof weapon.strengthModifier === 'number' && weapon.strengthModifier > 0 ? '+' : ''}${weapon.strengthModifier}`}</td>
              <td>{weapon.ap}</td>
              <td>{weapon.damage}</td>
              <td>
                {weapon.traits && weapon.traits.length > 0 
                  ? weapon.traits.join(', ')
                  : '-'
                }
              </td>
              <td>
                {weapon.specialRules.length > 0 
                  ? weapon.specialRules.map(ruleId => {
                      const rule = DataLoader.getSpecialRuleById(ruleId);
                      const value = weapon.specialRuleValues?.[ruleId];
                      const ruleDisplayName = value ? `${rule?.name || ruleId} (${value})` : rule?.name || ruleId;
                      return ruleDisplayName;
                    }).join(', ')
                  : '-'
                }
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    );
  };

  const renderSpecialRulesTable = (modelCompositions: { model: Model; count: number }[]) => {
    const ruleMap = new Map<string, { ruleId: string; value?: number; models: string[]; rule: any }>();
    
    modelCompositions.forEach(({ model, count }) => {
      // Add base special rules
      model.specialRules.forEach(ruleId => {
        const value = model.specialRuleValues?.[ruleId];
        const key = `${ruleId}-${value || 'no-value'}`;
        const displayName = count > 1 ? `${model.name} x${count}` : model.name;
        
        if (ruleMap.has(key)) {
          ruleMap.get(key)!.models.push(displayName);
        } else {
          const rule = DataLoader.getSpecialRuleById(ruleId);
          ruleMap.set(key, { ruleId, value, models: [displayName], rule });
        }
      });
      
      // Add special rules from wargear upgrades (only if they're actual special rules, not wargear)
      if (armyUnit?.modelInstanceWargearChanges?.[model.id]) {
        Object.entries(armyUnit.modelInstanceWargearChanges[model.id]).forEach(([instanceIndex, changes]) => {
          changes.added.forEach(wargearId => {
            const wargear = DataLoader.getSpecialRuleById(wargearId);
            if (wargear && wargear.type === 'special-rule') {
              // Only add if it's actually a special rule, not wargear
              const key = `${wargearId}-no-value`;
              const displayName = `${model.name} (upgraded)`;
              
              if (ruleMap.has(key)) {
                ruleMap.get(key)!.models.push(displayName);
              } else {
                ruleMap.set(key, { ruleId: wargearId, value: undefined, models: [displayName], rule: wargear });
              }
            }
          });
        });
      }
    });

    if (ruleMap.size === 0) {
      return <p>No special rules</p>;
    }

    return (
      <table className="special-rules-table">
        <thead>
          <tr>
            <th>Models</th>
            <th>Special Rule</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(ruleMap.values()).map(({ ruleId, value, models, rule }, index) => {
            const ruleDisplayName = value ? `${rule?.name || ruleId} (${value})` : rule?.name || ruleId;
            return (
              <tr key={`${ruleId}-${value || 'no-value'}-${index}`}>
                <td>{models.join(', ')}</td>
                <td>{ruleDisplayName}</td>
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
      // Add base wargear
      model.wargear.forEach(wargearId => {
        const displayName = count > 1 ? `${model.name} x${count}` : model.name;
        
        if (wargearMap.has(wargearId)) {
          wargearMap.get(wargearId)!.models.push(displayName);
        } else {
          const wargear = DataLoader.getSpecialRuleById(wargearId);
          wargearMap.set(wargearId, { wargearId, models: [displayName], wargear });
        }
      });
      
      // Add wargear from upgrades
      if (armyUnit?.modelInstanceWargearChanges?.[model.id]) {
        Object.entries(armyUnit.modelInstanceWargearChanges[model.id]).forEach(([instanceIndex, changes]) => {
          changes.added.forEach(wargearId => {
            const wargear = DataLoader.getSpecialRuleById(wargearId);
            if (wargear && wargear.type === 'wargear') {
              const displayName = `${model.name} (upgraded)`;
              
              if (wargearMap.has(wargearId)) {
                wargearMap.get(wargearId)!.models.push(displayName);
              } else {
                wargearMap.set(wargearId, { wargearId, models: [displayName], wargear });
              }
            }
          });
        });
      }
    });

    if (wargearMap.size === 0) {
      return <p>No wargear</p>;
    }

    return (
      <table className="wargear-table">
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
    <div className="unit-viewer">
      <div className="unit-viewer-header">
        <h2>{unit.name}</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>
      
      <div className="unit-viewer-content">
        <div className="unit-info">
          <p><strong>Faction:</strong> {formatFactionName(unit.faction)}</p>
          <p><strong>Battlefield Role:</strong> {unit.battlefieldRole}</p>
          <p><strong>Size:</strong> {actualSize} models</p>
          <p><strong>Base Points:</strong> {unit.points}</p>
          <p><strong>Types:</strong> {formatTypeSubtypes(modelCompositions)}</p>
          <p><strong>Description:</strong> {unit.description}</p>
        </div>

        <div className="unit-section">
          <h3>Characteristics</h3>
          {renderCharacteristicsTable(modelCompositions)}
        </div>

        <div className="unit-section">
          <h3>Ranged Weapons</h3>
          {renderRangedWeaponsTable(modelCompositions)}
        </div>

        <div className="unit-section">
          <h3>Melee Weapons</h3>
          {renderMeleeWeaponsTable(modelCompositions)}
        </div>

        <div className="unit-section">
          <h3>Special Rules</h3>
          {renderSpecialRulesTable(modelCompositions)}
        </div>

        <div className="unit-section">
          <h3>Wargear</h3>
          {renderWargearTable(modelCompositions)}
        </div>

        {unit.traits && unit.traits.length > 0 && (
          <div className="unit-section">
            <h3>Traits</h3>
            <div className="traits-list">
              {unit.traits.map((trait, index) => (
                <span key={index} className="trait-tag">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {armyUnit?.primeAdvantages && armyUnit.primeAdvantages.length > 0 && (
          <div className="unit-section">
            <h3>Prime Advantages</h3>
            <div className="prime-advantages-list">
              {armyUnit.primeAdvantages.map((advantage, index) => (
                <div key={index} className="prime-advantage-item">
                  <div className="advantage-name">{advantage.description}</div>
                  <div className="advantage-effect">{advantage.effect}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
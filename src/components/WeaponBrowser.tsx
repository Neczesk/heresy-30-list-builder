import React, { useState, useMemo } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import type { RangedWeapon, MeleeWeapon } from '../types/army';
import './WeaponBrowser.css';

interface WeaponBrowserProps {
  onBackToBrowserMenu: () => void;
}

const WeaponBrowser: React.FC<WeaponBrowserProps> = ({
  onBackToBrowserMenu
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const weapons = useMemo(() => DataLoader.getWeapons(), []);
  
  const rangedWeapons = useMemo(() => 
    weapons.filter(weapon => DataLoader.isRangedWeapon(weapon)) as RangedWeapon[], 
    [weapons]
  );
  
  const meleeWeapons = useMemo(() => 
    weapons.filter(weapon => !DataLoader.isRangedWeapon(weapon)) as MeleeWeapon[], 
    [weapons]
  );

  const filteredRangedWeapons = useMemo(() => {
    if (!searchTerm) return rangedWeapons;
    
    const searchLower = searchTerm.toLowerCase();
    return rangedWeapons.filter(weapon => 
      weapon.name.toLowerCase().includes(searchLower) ||
      weapon.description?.toLowerCase().includes(searchLower) ||
      weapon.specialRules?.some(rule => rule.toLowerCase().includes(searchLower)) ||
      weapon.traits?.some(trait => trait.toLowerCase().includes(searchLower))
    );
  }, [rangedWeapons, searchTerm]);

  const filteredMeleeWeapons = useMemo(() => {
    if (!searchTerm) return meleeWeapons;
    
    const searchLower = searchTerm.toLowerCase();
    return meleeWeapons.filter(weapon => 
      weapon.name.toLowerCase().includes(searchLower) ||
      weapon.description?.toLowerCase().includes(searchLower) ||
      weapon.specialRules?.some(rule => rule.toLowerCase().includes(searchLower)) ||
      weapon.traits?.some(trait => trait.toLowerCase().includes(searchLower))
    );
  }, [meleeWeapons, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const renderRangedWeaponRow = (weapon: RangedWeapon) => {
    // Handle weapons with multiple profiles
    if (weapon.profiles && weapon.profiles.length > 0) {
      return weapon.profiles.map((profile, index) => (
        <tr key={`${weapon.id}-${index}`} className={index === 0 ? 'weapon-group-header' : 'weapon-profile-row'}>
          <td>
            {index === 0 ? (
              <strong>{weapon.name}</strong>
            ) : (
              <span className="profile-name">{profile.name}</span>
            )}
          </td>
          <td>{profile.range}"</td>
          <td>{profile.firepower}</td>
          <td>{profile.rangedStrength}</td>
          <td>{profile.ap}</td>
          <td>{profile.damage}</td>
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
          <td>{profile.traits?.join(', ') || '-'}</td>
        </tr>
      ));
    } else {
      // Single profile weapon (backward compatibility)
      return (
        <tr key={weapon.id}>
          <td>{weapon.name}</td>
          <td>{weapon.range}"</td>
          <td>{weapon.firepower}</td>
          <td>{weapon.rangedStrength}</td>
          <td>{weapon.ap}</td>
          <td>{weapon.damage}</td>
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
          <td>{weapon.traits?.join(', ') || '-'}</td>
        </tr>
      );
    }
  };

  const renderMeleeWeaponRow = (weapon: MeleeWeapon) => (
    <tr key={weapon.id}>
      <td>{weapon.name}</td>
      <td>{weapon.attackModifier === "A" ? "A" : `${typeof weapon.attackModifier === 'number' && weapon.attackModifier > 0 ? '+' : ''}${weapon.attackModifier}`}</td>
      <td>{weapon.strengthModifier === "S" ? "S" : `${typeof weapon.strengthModifier === 'number' && weapon.strengthModifier > 0 ? '+' : ''}${weapon.strengthModifier}`}</td>
      <td>{weapon.ap}</td>
      <td>{weapon.damage}</td>
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
      <td>{weapon.traits?.join(', ') || '-'}</td>
    </tr>
  );

  return (
    <div className="weapon-browser">
      <div className="browser-header">
        <Button variant="secondary" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </Button>
        <h2>Weapon Browser</h2>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search weapons..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <Button variant="secondary" size="sm" onClick={clearSearch}>
                ×
              </Button>
            )}
          </div>
          <div className="search-results">
            {searchTerm && (
              <span className="results-count">
                {filteredRangedWeapons.length + filteredMeleeWeapons.length} of {rangedWeapons.length + meleeWeapons.length} weapons found
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="weapons-section">
        {/* Ranged Weapons Table */}
        <div className="weapon-table-section">
          <h3>Ranged Weapons ({filteredRangedWeapons.length})</h3>
          {filteredRangedWeapons.length === 0 ? (
            <div className="no-weapons">
              <p>No ranged weapons found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="weapon-table">
                <thead>
                  <tr>
                    <th>Name</th>
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
                  {filteredRangedWeapons.map(renderRangedWeaponRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Melee Weapons Table */}
        <div className="weapon-table-section">
          <h3>Melee Weapons ({filteredMeleeWeapons.length})</h3>
          {filteredMeleeWeapons.length === 0 ? (
            <div className="no-weapons">
              <p>No melee weapons found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="weapon-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Attack Mod</th>
                    <th>Strength Mod</th>
                    <th>AP</th>
                    <th>Damage</th>
                    <th>Special Rules</th>
                    <th>Traits</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeleeWeapons.map(renderMeleeWeaponRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeaponBrowser; 
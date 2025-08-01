import React, { useState, useEffect } from 'react';
import { DataLoader } from '../utils/dataLoader';
import type { RangedWeapon, MeleeWeapon } from '../types/army';
import './WeaponBrowser.css';

interface WeaponBrowserProps {
  onBackToBrowserMenu: () => void;
}

const WeaponBrowser: React.FC<WeaponBrowserProps> = ({
  onBackToBrowserMenu
}) => {
  const [rangedWeapons, setRangedWeapons] = useState<RangedWeapon[]>([]);
  const [meleeWeapons, setMeleeWeapons] = useState<MeleeWeapon[]>([]);
  const [filteredRangedWeapons, setFilteredRangedWeapons] = useState<RangedWeapon[]>([]);
  const [filteredMeleeWeapons, setFilteredMeleeWeapons] = useState<MeleeWeapon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load weapons on mount
  useEffect(() => {
    const ranged = DataLoader.getRangedWeapons();
    const melee = DataLoader.getMeleeWeapons();
    
    setRangedWeapons(ranged);
    setMeleeWeapons(melee);
    setFilteredRangedWeapons(ranged);
    setFilteredMeleeWeapons(melee);
  }, []);

  // Filter weapons based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRangedWeapons(rangedWeapons);
      setFilteredMeleeWeapons(meleeWeapons);
    } else {
      const filteredRanged = rangedWeapons.filter(weapon => 
        weapon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.specialRules?.some(rule => rule.toLowerCase().includes(searchTerm.toLowerCase())) ||
        weapon.traits?.some(trait => trait.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      const filteredMelee = meleeWeapons.filter(weapon => 
        weapon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.specialRules?.some(rule => rule.toLowerCase().includes(searchTerm.toLowerCase())) ||
        weapon.traits?.some(trait => trait.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setFilteredRangedWeapons(filteredRanged);
      setFilteredMeleeWeapons(filteredMelee);
    }
  }, [searchTerm, rangedWeapons, meleeWeapons]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const renderRangedWeaponRow = (weapon: RangedWeapon) => {
    // If weapon has multiple profiles, render them as a group
    if (weapon.profiles && weapon.profiles.length > 0) {
      return (
        <React.Fragment key={weapon.id}>
          {/* Weapon header row */}
          <tr className="weapon-header-row">
            <td colSpan={8} className="weapon-group-header">
              <div className="weapon-group-title">
                <span className="weapon-name">{weapon.name}</span>
                <span className="profile-count">({weapon.profiles.length} profile{weapon.profiles.length > 1 ? 's' : ''})</span>
              </div>
            </td>
          </tr>
          {/* Profile rows */}
          {weapon.profiles.map((profile, index) => (
            <tr key={`${weapon.id}-profile-${index}`} className="profile-row">
              <td className="profile-name">{profile.name}</td>
              <td>{profile.range}</td>
              <td>{profile.firepower}</td>
              <td>{profile.rangedStrength}</td>
              <td>{profile.ap}</td>
              <td>{profile.damage}</td>
              <td>{profile.specialRules?.join(', ') || '-'}</td>
              <td>{profile.traits?.join(', ') || '-'}</td>
            </tr>
          ))}
        </React.Fragment>
      );
    }

    // Single profile weapon (backward compatibility)
    return (
      <tr key={weapon.id}>
        <td className="weapon-name">{weapon.name}</td>
        <td>{weapon.range || '-'}</td>
        <td>{weapon.firepower || '-'}</td>
        <td>{weapon.rangedStrength || '-'}</td>
        <td>{weapon.ap || '-'}</td>
        <td>{weapon.damage || '-'}</td>
        <td>{weapon.specialRules?.join(', ') || '-'}</td>
        <td>{weapon.traits?.join(', ') || '-'}</td>
      </tr>
    );
  };

  const renderMeleeWeaponRow = (weapon: MeleeWeapon) => (
    <tr key={weapon.id}>
      <td className="weapon-name">{weapon.name}</td>
      <td>{weapon.attackModifier}</td>
      <td>{weapon.strengthModifier}</td>
      <td>{weapon.ap || '-'}</td>
      <td>{weapon.damage}</td>
      <td>{weapon.specialRules?.join(', ') || '-'}</td>
      <td>{weapon.traits?.join(', ') || '-'}</td>
    </tr>
  );

  return (
    <div className="weapon-browser">
      <div className="browser-header">
        <button className="back-to-menu-button" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </button>
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
              <button className="clear-search-button" onClick={clearSearch}>
                ×
              </button>
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
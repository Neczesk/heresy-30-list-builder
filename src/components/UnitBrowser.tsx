import React, { useState, useEffect } from 'react';
import { DataLoader } from '../utils/dataLoader';
import type { Unit, Model, Faction } from '../types/army';
import UnitDetailModal from './UnitDetailModal';
import './UnitBrowser.css';

interface UnitBrowserProps {
  onBackToBrowserMenu: () => void;
}

interface UnitWithModels extends Unit {
  modelsWithData: Array<{
    model: Model;
    count: number;
  }>;
}

const UnitBrowser: React.FC<UnitBrowserProps> = ({
  onBackToBrowserMenu
}) => {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [units, setUnits] = useState<UnitWithModels[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<UnitWithModels[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnitWithModels | null>(null);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    const allFactions = DataLoader.getFactions();
    const allUnits = DataLoader.getUnits();
    const allModels = DataLoader.getModels();
    
    // Filter to main factions only
    const mainFactions = allFactions.filter(faction => faction.isMainFaction);
    setFactions(mainFactions);
    
    // Enhance units with model data
    const enhancedUnits: UnitWithModels[] = allUnits.map(unit => ({
      ...unit,
      modelsWithData: Object.entries(unit.models).map(([modelId, count]) => {
        const model = allModels.find(m => m.id === modelId);
        return {
          model: model!,
          count
        };
      })
    }));
    
    setUnits(enhancedUnits);
  }, []);

  // Filter units based on faction and search term
  useEffect(() => {
    let filtered = units;

    // Filter by faction
    if (selectedFaction) {
      filtered = filtered.filter(unit => unit.faction === selectedFaction);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(unit => 
        unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.battlefieldRole.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUnits(filtered);
  }, [selectedFaction, searchTerm, units]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleFactionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFaction(e.target.value);
  };

  const handleUnitClick = (unit: UnitWithModels) => {
    setSelectedUnit(unit);
    setShowUnitModal(true);
  };

  const handleCloseModal = () => {
    setShowUnitModal(false);
    setSelectedUnit(null);
  };

  const getUnitsByRole = () => {
    const roleGroups: { [role: string]: UnitWithModels[] } = {};
    
    filteredUnits.forEach(unit => {
      if (!roleGroups[unit.battlefieldRole]) {
        roleGroups[unit.battlefieldRole] = [];
      }
      roleGroups[unit.battlefieldRole].push(unit);
    });

    return roleGroups;
  };

  const getFactionName = (factionId: string) => {
    const faction = factions.find(f => f.id === factionId);
    return faction ? faction.name : factionId;
  };

  const renderUnitCard = (unit: UnitWithModels) => (
    <div 
      key={unit.id} 
      className="unit-card"
      onClick={() => handleUnitClick(unit)}
    >
      <div className="unit-header">
        <h3 className="unit-name">{unit.name}</h3>
        <div className="unit-role-badge">{unit.battlefieldRole}</div>
      </div>
      
      <div className="unit-info">
        <div className="unit-description">{unit.description}</div>
        
        <div className="unit-details">
          <div className="unit-size">
            <span className="detail-label">Size:</span>
            <span className="detail-value">{unit.minSize}-{unit.maxSize} models</span>
          </div>
          
          <div className="unit-points">
            <span className="detail-label">Points:</span>
            <span className="detail-value">{unit.points} pts</span>
          </div>
          
          <div className="unit-models">
            <span className="detail-label">Models:</span>
            <span className="detail-value">
              {unit.modelsWithData.map((modelData, index) => (
                <span key={modelData.model.id} className="model-count">
                  {modelData.count}x {modelData.model.name}
                  {index < unit.modelsWithData.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const roleGroups = getUnitsByRole();

  return (
    <div className="unit-browser">
      <div className="browser-header">
        <button className="back-to-menu-button" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </button>
        <h2>Unit Browser</h2>
      </div>

      <div className="filter-section">
        <div className="faction-filter">
          <label htmlFor="faction-select">Select Faction:</label>
          <select
            id="faction-select"
            value={selectedFaction}
            onChange={handleFactionChange}
            className="faction-select"
          >
            <option value="">Choose a faction...</option>
            {factions.map(faction => (
              <option key={faction.id} value={faction.id}>
                {faction.name}
              </option>
            ))}
          </select>
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
              disabled={!selectedFaction}
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
                {filteredUnits.length} of {units.filter(u => !selectedFaction || u.faction === selectedFaction).length} units found
              </span>
            )}
          </div>
        </div>
      </div>

      {!selectedFaction ? (
        <div className="faction-selection">
          <div className="faction-selection-content">
            <h3>Select a Faction</h3>
            <p>Choose a faction to view its units organized by battlefield role.</p>
          </div>
        </div>
      ) : (
        <div className="units-section">
          {Object.keys(roleGroups).length === 0 ? (
            <div className="no-units">
              <p>No units found for {getFactionName(selectedFaction)} matching your search criteria.</p>
            </div>
          ) : (
            Object.entries(roleGroups).map(([role, roleUnits]) => (
              <div key={role} className="role-group">
                <div className="role-header">
                  <h3>{role} Units ({roleUnits.length})</h3>
                </div>
                <div className="units-grid">
                  {roleUnits.map(renderUnitCard)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showUnitModal && selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          isOpen={showUnitModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default UnitBrowser; 
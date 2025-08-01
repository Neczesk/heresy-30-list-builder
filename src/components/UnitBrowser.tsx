import React, { useState, useMemo } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import UnitDetailModal from './UnitDetailModal';
import type { Unit, Model } from '../types/army';
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
  const [selectedFaction, setSelectedFaction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithModels | null>(null);

  const factions = useMemo(() => DataLoader.getFactions(), []);
  const units = useMemo(() => {
    const allUnits = DataLoader.getUnits();
    return allUnits.map(unit => {
      const modelsWithData = Object.entries(unit.models).map(([modelId, count]) => {
        const model = DataLoader.getModelById(modelId);
        return { model: model!, count };
      });
      return { ...unit, modelsWithData };
    });
  }, []);

  const filteredUnits = useMemo(() => {
    let filtered = units;
    
    if (selectedFaction) {
      filtered = filtered.filter(unit => unit.faction === selectedFaction);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(unit => 
        unit.name.toLowerCase().includes(searchLower) ||
        unit.battlefieldRole.toLowerCase().includes(searchLower) ||
        unit.description.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [units, selectedFaction, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleFactionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFaction(e.target.value);
    setSearchTerm(''); // Clear search when faction changes
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
      const role = unit.battlefieldRole;
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      roleGroups[role].push(unit);
    });
    
    return roleGroups;
  };

  const getFactionName = (factionId: string) => {
    const faction = DataLoader.getFactionById(factionId);
    return faction?.name || factionId;
  };

  const renderUnitCard = (unit: UnitWithModels) => (
    <div
      key={unit.id}
      className="unit-card"
      onClick={() => handleUnitClick(unit)}
    >
      <div className="unit-card-header">
        <h4>{unit.name}</h4>
        <div className="unit-role-badge">
          {unit.battlefieldRole}
        </div>
      </div>
      
      <div className="unit-card-content">
        <div className="unit-info">
          <div className="unit-size">
            <span className="info-label">Size:</span>
            <span className="info-value">{unit.minSize}-{unit.maxSize} models</span>
          </div>
          <div className="unit-points">
            <span className="info-label">Points:</span>
            <span className="info-value">{unit.points} pts</span>
          </div>
        </div>
        
        <div className="unit-description">
          <p>{unit.description}</p>
        </div>
        
        <div className="unit-models">
          <span className="info-label">Models:</span>
          <div className="model-list">
            {unit.modelsWithData.map(({ model, count }, index) => (
              <span key={model.id} className="model-item">
                {count}x {model.name}
                {index < unit.modelsWithData.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const roleGroups = getUnitsByRole();

  return (
    <div className="unit-browser">
      <div className="browser-header">
        <Button variant="secondary" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </Button>
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
              <Button variant="secondary" size="sm" onClick={clearSearch}>
                ×
              </Button>
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
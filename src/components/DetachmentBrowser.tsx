import React, { useState, useEffect } from 'react';
import { DataLoader } from '../utils/dataLoader';
import type { Detachment, BattlefieldRole } from '../types/army';
import './DetachmentBrowser.css';

interface DetachmentBrowserProps {
  onBackToBrowserMenu: () => void;
}

interface DetachmentWithRoles extends Detachment {
  slotsWithRoles: Array<{
    role: BattlefieldRole;
    count: number;
    isPrime: boolean;
    description?: string;
  }>;
}

const DetachmentBrowser: React.FC<DetachmentBrowserProps> = ({
  onBackToBrowserMenu
}) => {
  const [detachments, setDetachments] = useState<DetachmentWithRoles[]>([]);
  const [filteredDetachments, setFilteredDetachments] = useState<DetachmentWithRoles[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Load detachments on mount
  useEffect(() => {
    const allDetachments = DataLoader.getDetachments();
    const battlefieldRoles = DataLoader.getBattlefieldRoles();
    
    // Enhance detachments with role information
    const enhancedDetachments: DetachmentWithRoles[] = allDetachments.map(detachment => ({
      ...detachment,
      slotsWithRoles: detachment.slots.map(slot => {
        const role = battlefieldRoles.find(r => r.id === slot.roleId);
        return {
          role: role!,
          count: slot.count,
          isPrime: slot.isPrime,
          description: slot.description
        };
      })
    }));
    
    setDetachments(enhancedDetachments);
    setFilteredDetachments(enhancedDetachments);
  }, []);

  // Filter detachments based on search term and type
  useEffect(() => {
    let filtered = detachments;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(detachment => detachment.type === selectedType);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(detachment => 
        detachment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detachment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detachment.slotsWithRoles.some(slot => 
          slot.role.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredDetachments(filtered);
  }, [searchTerm, selectedType, detachments]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
  };

  const getDetachmentTypeColor = (type: string) => {
    switch (type) {
      case 'Primary': return '#4caf50';
      case 'Auxiliary': return '#ff9800';
      case 'Apex': return '#9c27b0';
      case 'Warlord': return '#f44336';
      case 'Allied': return '#2196f3';
      case 'Universal': return '#607d8b';
      default: return '#666';
    }
  };

  const getDetachmentTypeIcon = (type: string) => {
    switch (type) {
      case 'Primary': return '⚔️';
      case 'Auxiliary': return '🛡️';
      case 'Apex': return '👑';
      case 'Warlord': return '⚜️';
      case 'Allied': return '🤝';
      case 'Universal': return '🌐';
      default: return '📋';
    }
  };

  const renderDetachmentCard = (detachment: DetachmentWithRoles) => (
    <div key={detachment.id} className="detachment-card">
      <div className="detachment-header">
        <div className="detachment-type-badge" style={{ backgroundColor: getDetachmentTypeColor(detachment.type) }}>
          {getDetachmentTypeIcon(detachment.type)} {detachment.type}
        </div>
        <h3 className="detachment-name">{detachment.name}</h3>
      </div>
      
      <div className="detachment-description">
        {detachment.description}
      </div>

      {detachment.requirements.length > 0 && (
        <div className="detachment-requirements">
          <h4>Requirements:</h4>
          <ul>
            {detachment.requirements.map((req, index) => (
              <li key={index}>{req.description}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="detachment-slots">
        <h4>Slots:</h4>
        <div className="slots-grid">
          {detachment.slotsWithRoles.map((slot, index) => (
            <div key={index} className={`slot-item ${slot.isPrime ? 'prime-slot' : 'regular-slot'}`}>
              <div className="slot-header">
                <span className="slot-role">{slot.role.name}</span>
                <span className="slot-count">{slot.count}</span>
                {slot.isPrime && <span className="prime-badge">Prime</span>}
              </div>
              {slot.description && (
                <div className="slot-description">{slot.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {detachment.restrictions && detachment.restrictions.length > 0 && (
        <div className="detachment-restrictions">
          <h4>Restrictions:</h4>
          <ul>
            {detachment.restrictions.map((restriction, index) => (
              <li key={index}>{restriction.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const getDetachmentTypes = () => {
    const types = Array.from(new Set(detachments.map(d => d.type)));
    return types.sort();
  };

  const getDetachmentsByType = (type: string) => {
    return filteredDetachments.filter(detachment => 
      type === 'all' ? true : detachment.type === type
    );
  };

  return (
    <div className="detachment-browser">
      <div className="browser-header">
        <button className="back-to-menu-button" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </button>
        <h2>Detachment Browser</h2>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search detachments..."
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
                {filteredDetachments.length} of {detachments.length} detachments found
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="type-filter">
          <label htmlFor="type-select">Filter by Type:</label>
          <select
            id="type-select"
            value={selectedType}
            onChange={handleTypeChange}
            className="type-select"
          >
            <option value="all">All Types</option>
            {getDetachmentTypes().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="detachments-section">
        {getDetachmentTypes().map(type => {
          const typeDetachments = getDetachmentsByType(type);
          if (typeDetachments.length === 0) return null;

          return (
            <div key={type} className="detachment-type-group">
              <div className="type-header" style={{ borderLeftColor: getDetachmentTypeColor(type) }}>
                <h3>
                  {getDetachmentTypeIcon(type)} {type} Detachments ({typeDetachments.length})
                </h3>
              </div>
              <div className="detachments-grid">
                {typeDetachments.map(renderDetachmentCard)}
              </div>
            </div>
          );
        })}

        {filteredDetachments.length === 0 && (
          <div className="no-detachments">
            <p>No detachments found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetachmentBrowser; 
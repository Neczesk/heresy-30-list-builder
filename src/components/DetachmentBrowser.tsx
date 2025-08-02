import React, { useState, useMemo } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import styles from './DetachmentBrowser.module.css';
import type { Detachment, BattlefieldRole } from '../types/army';

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const detachments = useMemo(() => {
    const allDetachments = DataLoader.getDetachments();
    return allDetachments.map(detachment => {
      const slotsWithRoles = detachment.slots.map(slot => {
        const role = DataLoader.getBattlefieldRoleById(slot.roleId);
        return {
          role: role!,
          count: slot.count,
          isPrime: slot.isPrime,
          description: slot.description
        };
      });
      return { ...detachment, slotsWithRoles };
    });
  }, []);

  const filteredDetachments = useMemo(() => {
    let filtered = detachments;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(detachment => 
        detachment.name.toLowerCase().includes(searchLower) ||
        detachment.description.toLowerCase().includes(searchLower) ||
        detachment.type.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(detachment => detachment.type === selectedType);
    }
    
    return filtered;
  }, [detachments, searchTerm, selectedType]);

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
      case 'Primary':
        return '#4CAF50'; // Green
      case 'Auxiliary':
        return '#FF9800'; // Orange
      case 'Apex':
        return '#9C27B0'; // Purple
      case 'Warlord':
        return '#F44336'; // Red
      case 'Allied':
        return '#2196F3'; // Blue
      case 'Universal':
        return '#607D8B'; // Blue Grey
      default:
        return '#757575'; // Grey
    }
  };

  const getDetachmentTypeIcon = (type: string) => {
    switch (type) {
      case 'Primary':
        return '⚔️';
      case 'Auxiliary':
        return '🛡️';
      case 'Apex':
        return '👑';
      case 'Warlord':
        return '⚜️';
      case 'Allied':
        return '🤝';
      case 'Universal':
        return '🌐';
      default:
        return '📋';
    }
  };

  const renderDetachmentCard = (detachment: DetachmentWithRoles) => (
    <div key={detachment.id} className={styles['detachment-card']}>
      <div className={styles['detachment-card-header']}>
        <h4>{detachment.name}</h4>
        <div className={styles['detachment-type-badge']} style={{ backgroundColor: getDetachmentTypeColor(detachment.type) }}>
          {detachment.type}
        </div>
      </div>
      
      <div className={styles['detachment-card-content']}>
        <div className={styles['detachment-description']}>
          <p>{detachment.description}</p>
        </div>
        
        <div className={styles['detachment-slots']}>
          <h5>Slots:</h5>
          <div className={styles['slots-list']}>
            {detachment.slotsWithRoles.map((slot, index) => (
              <div key={index} className={styles['slot-item']}>
                <span className={styles['slot-role']}>{slot.role.name}</span>
                <span className={styles['slot-count']}>{slot.count}</span>
                {slot.isPrime && <span className={styles['prime-indicator']}>★</span>}
              </div>
            ))}
          </div>
        </div>
        
        {detachment.requirements && detachment.requirements.length > 0 && (
          <div className={styles['detachment-requirements']}>
            <h5>Requirements:</h5>
            <ul className={styles['requirements-list']}>
              {detachment.requirements.map((req, index) => (
                <li key={index} className={styles['requirement-item']}>
                  {req.description || `${req.type}: ${req.value}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
    <div className={styles['detachment-browser']}>
      <div className={styles['browser-header']}>
        <Button variant="secondary" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </Button>
        <h2>Detachment Browser</h2>
      </div>

      <div className={styles['search-section']}>
        <div className={styles['search-container']}>
          <div className={styles['search-input-wrapper']}>
            <input
              type="text"
              placeholder="Search detachments..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles['search-input']}
            />
            {searchTerm && (
              <Button variant="secondary" size="sm" onClick={clearSearch}>
                ×
              </Button>
            )}
          </div>
          <div className={styles['search-results']}>
            {searchTerm && (
              <span className={styles['results-count']}>
                {filteredDetachments.length} of {detachments.length} detachments found
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles['filter-section']}>
        <div className={styles['type-filter']}>
          <label htmlFor="type-select">Filter by Type:</label>
          <select
            id="type-select"
            value={selectedType}
            onChange={handleTypeChange}
            className={styles['type-select']}
          >
            <option value="all">All Types</option>
            {getDetachmentTypes().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles['detachments-section']}>
        {getDetachmentTypes().map(type => {
          const typeDetachments = getDetachmentsByType(type);
          if (typeDetachments.length === 0) return null;

          return (
            <div key={type} className={styles['detachment-type-group']}>
              <div className={styles['type-header']} style={{ borderLeftColor: getDetachmentTypeColor(type) }}>
                <h3>
                  {getDetachmentTypeIcon(type)} {type} Detachments ({typeDetachments.length})
                </h3>
              </div>
              <div className={styles['detachments-grid']}>
                {typeDetachments.map(renderDetachmentCard)}
              </div>
            </div>
          );
        })}

        {filteredDetachments.length === 0 && (
          <div className={styles['no-detachments']}>
            <p>No detachments found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetachmentBrowser; 
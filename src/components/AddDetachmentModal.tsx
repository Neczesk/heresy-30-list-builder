import React, { useState } from 'react';
import { DataLoader } from '../utils/dataLoader';
import AlliedFactionSelector from './AlliedFactionSelector';
import DetachmentSlots from './DetachmentSlots';
import type { Detachment, ArmyList, Faction } from '../types/army';
import './AddDetachmentModal.css';

interface AddDetachmentModalProps {
  armyList: ArmyList;
  onAddDetachment: (detachment: Detachment) => void;
  onClose: () => void;
}

const AddDetachmentModal: React.FC<AddDetachmentModalProps> = ({
  armyList,
  onAddDetachment,
  onClose
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAlliedSelector, setShowAlliedSelector] = useState(false);
  
  const availableDetachments = DataLoader.getAvailableDetachments(armyList);
  
  const detachmentTypes = [
    { id: 'all', name: 'All Available' },
    { id: 'Auxiliary', name: 'Auxiliary' },
    { id: 'Apex', name: 'Apex' },
    { id: 'Universal', name: 'Universal' },
    { id: 'Allied', name: 'Allied' }
  ];

  const filteredDetachments = selectedType === 'all' 
    ? availableDetachments 
    : availableDetachments.filter(d => d.type === selectedType);

  const handleDetachmentSelect = (detachment: Detachment) => {
    if (detachment.type === 'Allied') {
      setShowAlliedSelector(true);
    } else {
      onAddDetachment(detachment);
      onClose();
    }
  };

  const handleAlliedFactionSelected = (detachment: Detachment, faction: Faction, subFaction?: Faction) => {
    // Create a copy of the detachment with the selected faction
    const alliedDetachment = {
      ...detachment,
      faction: subFaction ? subFaction.id : faction.id
    };
    onAddDetachment(alliedDetachment);
    onClose();
  };

  const getDetachmentTypeColor = (type: string): string => {
    switch (type) {
      case 'Auxiliary': return '#4caf50';
      case 'Apex': return '#ff9800';
      case 'Universal': return '#9c27b0';
      case 'Allied': return '#2196f3';
      default: return '#666';
    }
  };

  const getTriggerDescription = (detachment: Detachment): string => {
    if (!detachment.triggers) return 'Always available';
    
    const triggers = detachment.triggers.map(trigger => {
      switch (trigger.type) {
        case 'command-filled': return 'Command slot filled';
        case 'high-command-filled': return 'High Command slot filled';
        case 'always-available': return 'Always available';
        default: return trigger.description;
      }
    });
    
    return triggers.join(', ');
  };

  if (showAlliedSelector) {
    return (
      <AlliedFactionSelector
        primaryFactionId={armyList.faction}
        onFactionSelected={handleAlliedFactionSelected}
        onCancel={() => setShowAlliedSelector(false)}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Detachment</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="filter-section">
            <label>Filter by type:</label>
            <div className="filter-buttons">
              {detachmentTypes.map(type => (
                <button
                  key={type.id}
                  className={`filter-button ${selectedType === type.id ? 'active' : ''}`}
                  onClick={() => setSelectedType(type.id)}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          <div className="detachments-list">
            {filteredDetachments.length === 0 ? (
              <div className="no-detachments">
                <p>No detachments available for the current army list.</p>
                <p className="hint">Add units to Command or High Command slots to unlock more detachments.</p>
              </div>
            ) : (
              filteredDetachments.map(detachment => (
                <div
                  key={detachment.id}
                  className="detachment-option"
                  onClick={() => handleDetachmentSelect(detachment)}
                >
                  <div className="detachment-header">
                    <h3>{detachment.name}</h3>
                    <span 
                      className="detachment-type"
                      style={{ backgroundColor: getDetachmentTypeColor(detachment.type) }}
                    >
                      {detachment.type}
                    </span>
                  </div>
                  
                  <p className="detachment-description">{detachment.description}</p>
                  
                  <div className="detachment-trigger">
                    <span className="trigger-label">Trigger:</span>
                    <span className="trigger-value">{getTriggerDescription(detachment)}</span>
                  </div>
                  
                  {/* Visual Slot Display */}
                  <DetachmentSlots 
                    detachment={detachment}
                    armyDetachment={{ detachmentId: detachment.id, units: [], primeAdvantages: [] }}
                    armyList={armyList}
                    onUnitSelected={() => {}} // No-op for display only
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDetachmentModal; 
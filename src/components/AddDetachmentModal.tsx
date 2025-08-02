import React, { useState } from 'react';
import { Button, Card } from './ui';
import { DataLoader } from '../utils/dataLoader';
import AlliedFactionSelector from './AlliedFactionSelector';
import DetachmentSlots from './DetachmentSlots';
import type { Army, Detachment, Faction } from '../types/army';
import styles from './AddDetachmentModal.module.css';

interface AddDetachmentModalProps {
  armyList: Army;
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
  
  const availableDetachments = DataLoader.getAvailableDetachments(armyList).filter(d => d.id !== 'crusade-primary');
  
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
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={styles['modal-content']} onClick={e => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <h2>Add Detachment</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['filter-section']}>
            <label>Filter by type:</label>
            <div className={styles['filter-buttons']}>
              {detachmentTypes.map(type => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? 'warning' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedType(type.id)}
                >
                  {type.name}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles['detachments-list']}>
            {filteredDetachments.length === 0 ? (
              <Card variant="transparent" padding="lg" className={styles['no-detachments']}>
                <p>No detachments available for the current army list.</p>
                <p className={styles.hint}>Add units to Command or High Command slots to unlock more detachments.</p>
              </Card>
            ) : (
              filteredDetachments.map(detachment => (
                <Card
                  key={detachment.id}
                  variant="default"
                  padding="lg"
                  interactive
                  className={styles['detachment-option']}
                  onClick={() => handleDetachmentSelect(detachment)}
                >
                  <div className={styles['detachment-header']}>
                    <h3>{detachment.name}</h3>
                    <span 
                      className={styles['detachment-type']}
                      style={{ backgroundColor: getDetachmentTypeColor(detachment.type) }}
                    >
                      {detachment.type}
                    </span>
                  </div>
                  
                  <p className={styles['detachment-description']}>{detachment.description}</p>
                  
                  <div className={styles['detachment-trigger']}>
                    <span className={styles['trigger-label']}>Trigger:</span>
                    <span className={styles['trigger-value']}>{getTriggerDescription(detachment)}</span>
                  </div>
                  
                  {/* Visual Slot Display */}
                  <DetachmentSlots 
                    detachment={detachment}
                    armyDetachment={{ 
                      id: `${detachment.id}-preview`,
                      detachmentId: detachment.id,
                      customName: undefined,
                      points: 0,
                      baseSlots: detachment.slots,
                      modifiedSlots: detachment.slots,
                      primeAdvantages: [],
                      units: []
                    }}
                    armyList={armyList}
                    onUnitSelected={() => {}} // No-op for display only
                  />
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDetachmentModal; 
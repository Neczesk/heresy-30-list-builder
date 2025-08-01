import React from 'react';
import { Card } from './ui';
import type { Allegiance } from '../types/army';
import './AllegianceSelector.css';

interface AllegianceSelectorProps {
  selectedAllegiance: Allegiance;
  onAllegianceChange: (allegiance: Allegiance) => void;
  disabled?: boolean;
}

const AllegianceSelector: React.FC<AllegianceSelectorProps> = ({
  selectedAllegiance,
  onAllegianceChange,
  disabled = false
}) => {
  const allegiances: { value: Allegiance; label: string; description: string }[] = [
    {
      value: 'Loyalist',
      label: 'Loyalist',
      description: 'Remain faithful to the Emperor'
    },
    {
      value: 'Traitor',
      label: 'Traitor',
      description: 'Follow the Warmaster into heresy'
    }
  ];

  return (
    <div className="allegiance-selector">
      <h3>Select Allegiance</h3>
      <p>Choose your army's allegiance in the Horus Heresy.</p>
      
      <div className="allegiance-options">
        {allegiances.map((allegiance) => (
          <Card
            key={allegiance.value}
            variant={selectedAllegiance === allegiance.value ? 'elevated' : 'default'}
            padding="lg"
            interactive={!disabled}
            className={`allegiance-option ${selectedAllegiance === allegiance.value ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onAllegianceChange(allegiance.value)}
          >
            <div className="allegiance-header">
              <h4>{allegiance.label}</h4>
              {selectedAllegiance === allegiance.value && (
                <span className="selected-indicator">✓</span>
              )}
            </div>
            <p className="allegiance-description">{allegiance.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllegianceSelector; 
import React from 'react';
import { Card } from './ui';
import type { Allegiance } from '../types/army';
import styles from './AllegianceSelector.module.css';

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
    <div className={styles['allegiance-selector']}>
      <h3>Select Allegiance</h3>
      <p>Choose your army's allegiance in the Horus Heresy.</p>
      
      <div className={styles['allegiance-options']}>
        {allegiances.map((allegiance) => (
          <Card
            key={allegiance.value}
            variant="dark"
            padding="lg"
            interactive={!disabled}
            className={`${styles['allegiance-option']} ${selectedAllegiance === allegiance.value ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
            onClick={() => !disabled && onAllegianceChange(allegiance.value)}
          >
            <div className={styles['allegiance-header']}>
              <h4>{allegiance.label}</h4>
              {selectedAllegiance === allegiance.value && (
                <span className={styles['selected-indicator']}>✓</span>
              )}
            </div>
            <p className={styles['allegiance-description']}>{allegiance.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllegianceSelector; 
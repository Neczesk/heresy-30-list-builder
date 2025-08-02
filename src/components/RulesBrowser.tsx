import React, { useState } from 'react';
import { Button } from './ui';
import UnitBrowser from './UnitBrowser';
import DetachmentBrowser from './DetachmentBrowser';
import SpecialRulesBrowser from './SpecialRulesBrowser';
import WargearBrowser from './WargearBrowser';
import WeaponBrowser from './WeaponBrowser';
import styles from './RulesBrowser.module.css';

interface RulesBrowserProps {
  onBackToMenu: () => void;
}

const RulesBrowser: React.FC<RulesBrowserProps> = ({
  onBackToMenu
}) => {
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>(null);

  const browserOptions = [
    {
      id: 'unit-browser',
      name: 'Unit Browser',
      description: 'Browse all available units by faction and battlefield role',
      icon: '👥'
    },
    {
      id: 'detachment-browser',
      name: 'Detachment Browser',
      description: 'Browse all available detachments and their slot configurations',
      icon: '⚔️'
    },
    {
      id: 'special-rules-browser',
      name: 'Special Rules Browser',
      description: 'Browse all special rules and their descriptions',
      icon: '📖'
    },
    {
      id: 'wargear-browser',
      name: 'Wargear Browser',
      description: 'Browse all wargear options and their effects',
      icon: '🛡️'
    },
    {
      id: 'weapon-browser',
      name: 'Weapon Browser',
      description: 'Browse all weapons with their characteristics and special rules',
      icon: '🔫'
    }
  ];

  const handleBrowserSelect = (browserId: string) => {
    setSelectedBrowser(browserId);
  };

  const handleBackToBrowserMenu = () => {
    setSelectedBrowser(null);
  };

  const renderBrowserMenu = () => (
    <div className={styles.browserMenu}>
      <div className={styles.browserMenuHeader}>
        <h2>Select a Browser</h2>
        <p>Choose a category to browse the available rules and units</p>
      </div>
      
      <div className={styles.browserOptions}>
        {browserOptions.map((option) => (
          <div
            key={option.id}
            className={styles.browserOption}
            onClick={() => handleBrowserSelect(option.id)}
          >
            <div className={styles.browserOptionIcon}>
              {option.icon}
            </div>
            <div className={styles.browserOptionContent}>
              <h3>{option.name}</h3>
              <p>{option.description}</p>
            </div>
            <div className={styles.browserOptionArrow}>
              →
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSelectedBrowser = () => {
    const selectedOption = browserOptions.find(option => option.id === selectedBrowser);
    
    if (!selectedOption) return null;

    // Render Special Rules Browser
    if (selectedBrowser === 'special-rules-browser') {
      return <SpecialRulesBrowser onBackToBrowserMenu={handleBackToBrowserMenu} />;
    }

    // Render Wargear Browser
    if (selectedBrowser === 'wargear-browser') {
      return <WargearBrowser onBackToBrowserMenu={handleBackToBrowserMenu} />;
    }

    // Render Weapon Browser
    if (selectedBrowser === 'weapon-browser') {
      return <WeaponBrowser onBackToBrowserMenu={handleBackToBrowserMenu} />;
    }

    // Render Detachment Browser
    if (selectedBrowser === 'detachment-browser') {
      return <DetachmentBrowser onBackToBrowserMenu={handleBackToBrowserMenu} />;
    }

    // Render Unit Browser
    if (selectedBrowser === 'unit-browser') {
      return <UnitBrowser onBackToBrowserMenu={handleBackToBrowserMenu} />;
    }

    // Render placeholder for other browsers
    return (
      <div className={styles.selectedBrowser}>
        <div className={styles.selectedBrowserHeader}>
          <Button variant="secondary" onClick={handleBackToBrowserMenu}>
            ← Back to Browser Menu
          </Button>
          <h2>{selectedOption.name}</h2>
        </div>
        
        <div className={styles.browserPlaceholder}>
          <div className={styles.placeholderContent}>
            <div className={styles.placeholderIcon}>{selectedOption.icon}</div>
            <h3>{selectedOption.name}</h3>
            <p>This browser is not yet implemented.</p>
            <p className={styles.placeholderDescription}>
              {selectedOption.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.rulesBrowserPage}>
      <div className={styles.rulesBrowserHeader}>
        <div className={styles.headerContent}>
          <h1>Rules Browser</h1>
          <Button variant="secondary" onClick={onBackToMenu}>
            ← Back to Menu
          </Button>
        </div>
      </div>

      <div className={styles.rulesBrowserContent}>
        <div className={styles.rulesBrowserBody}>
          {selectedBrowser ? renderSelectedBrowser() : renderBrowserMenu()}
        </div>
      </div>
    </div>
  );
};

export default RulesBrowser; 
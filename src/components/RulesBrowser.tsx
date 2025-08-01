import React, { useState } from 'react';
import SpecialRulesBrowser from './SpecialRulesBrowser';
import WargearBrowser from './WargearBrowser';
import WeaponBrowser from './WeaponBrowser';
import DetachmentBrowser from './DetachmentBrowser';
import UnitBrowser from './UnitBrowser';
import './RulesBrowser.css';

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
      description: 'Browse and search all available units',
      icon: '👥'
    },
    {
      id: 'detachment-browser',
      name: 'Detachment Browser',
      description: 'Browse and search all available detachments',
      icon: '⚔️'
    },
    {
      id: 'special-rules-browser',
      name: 'Special Rules Browser',
      description: 'Browse and search all special rules',
      icon: '📜'
    },
    {
      id: 'wargear-browser',
      name: 'Wargear Browser',
      description: 'Browse and search all wargear options',
      icon: '🛡️'
    },
    {
      id: 'weapon-browser',
      name: 'Weapon Browser',
      description: 'Browse and search all weapons',
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
    <div className="browser-menu">
      <div className="browser-menu-header">
        <h2>Rules Browser</h2>
        <p>Select a category to browse and search rules, units, and equipment</p>
      </div>
      
      <div className="browser-options">
        {browserOptions.map((option) => (
          <div
            key={option.id}
            className="browser-option"
            onClick={() => handleBrowserSelect(option.id)}
          >
            <div className="browser-option-icon">
              {option.icon}
            </div>
            <div className="browser-option-content">
              <h3>{option.name}</h3>
              <p>{option.description}</p>
            </div>
            <div className="browser-option-arrow">
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
      <div className="selected-browser">
        <div className="selected-browser-header">
          <button className="back-to-menu-button" onClick={handleBackToBrowserMenu}>
            ← Back to Browser Menu
          </button>
          <h2>{selectedOption.name}</h2>
        </div>
        
        <div className="browser-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">{selectedOption.icon}</div>
            <h3>{selectedOption.name}</h3>
            <p>This browser is not yet implemented.</p>
            <p className="placeholder-description">
              {selectedOption.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rules-browser-page">
      <div className="rules-browser-header">
        <div className="header-content">
          <h1>Rules Browser</h1>
          <button className="back-button" onClick={onBackToMenu}>
            ← Back to Menu
          </button>
        </div>
      </div>

      <div className="rules-browser-content">
        <div className="rules-browser-body">
          {selectedBrowser ? renderSelectedBrowser() : renderBrowserMenu()}
        </div>
      </div>
    </div>
  );
};

export default RulesBrowser; 
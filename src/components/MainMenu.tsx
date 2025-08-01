import React from 'react';
import './MainMenu.css';

interface MainMenuProps {
  onNewList: () => void;
  onLoadList: () => void;
  onEditUnits: () => void;
  onEditDetachments: () => void;
  onRulesBrowser: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onNewList,
  onLoadList,
  onEditUnits,
  onEditDetachments,
  onRulesBrowser
}) => {
  return (
    <div className="main-menu">
      <div className="menu-header">
        <h1>Horus Heresy 3.0</h1>
        <h2>Army List Builder</h2>
      </div>
      
      <div className="menu-options">
        <div className="menu-section">
          <h3>Army Lists</h3>
          <button 
            className="menu-button primary"
            onClick={onNewList}
          >
            Create New Army List
          </button>
          <button 
            className="menu-button secondary"
            onClick={onLoadList}
          >
            Load Existing Army List
          </button>
        </div>

        <div className="menu-section">
          <h3>Data Management</h3>
          <button 
            className="menu-button"
            onClick={onEditUnits}
          >
            Edit Units
          </button>
          <button 
            className="menu-button"
            onClick={onEditDetachments}
          >
            Edit Detachments
          </button>
        </div>

        <div className="menu-section">
          <h3>Reference</h3>
          <button 
            className="menu-button"
            onClick={onRulesBrowser}
          >
            Rules Browser
          </button>
        </div>
      </div>

      <div className="menu-footer">
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default MainMenu; 
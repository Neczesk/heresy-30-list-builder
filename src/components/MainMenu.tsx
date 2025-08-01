import React from 'react';
import { Button, Card } from './ui';
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
        <Card variant="transparent" padding="lg" className="menu-section">
          <h3>Army Lists</h3>
          <Button 
            variant="warning"
            size="lg"
            fullWidth
            onClick={onNewList}
          >
            Create New Army List
          </Button>
          <Button 
            variant="info"
            size="lg"
            fullWidth
            onClick={onLoadList}
          >
            Load Existing Army List
          </Button>
        </Card>

        <Card variant="transparent" padding="lg" className="menu-section">
          <h3>Data Management</h3>
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            onClick={onEditUnits}
          >
            Edit Units
          </Button>
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            onClick={onEditDetachments}
          >
            Edit Detachments
          </Button>
        </Card>

        <Card variant="transparent" padding="lg" className="menu-section">
          <h3>Reference</h3>
          <Button 
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onRulesBrowser}
          >
            Rules Browser
          </Button>
        </Card>
      </div>

      <div className="menu-footer">
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default MainMenu; 
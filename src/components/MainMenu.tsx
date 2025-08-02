import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from './ui';
import styles from './MainMenu.module.css';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles['main-menu']}>
      <div className={styles['menu-header']}>
        <h1>Horus Heresy 3.0</h1>
        <h2>Army List Builder</h2>
      </div>
      
      <div className={styles['menu-options']}>
        <Card variant="transparent" padding="lg" className={styles['menu-section']}>
          <h3>Army Lists</h3>
          <Button 
            variant="warning"
            size="lg"
            fullWidth
            onClick={() => navigate('/army-builder')}
          >
            Create New Army List
          </Button>
          <Button 
            variant="info"
            size="lg"
            fullWidth
            onClick={() => navigate('/load-list')}
          >
            Load Existing Army List
          </Button>
        </Card>

        <Card variant="transparent" padding="lg" className={styles['menu-section']}>
          <h3>Data Management</h3>
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/edit-units')}
          >
            Edit Units
          </Button>
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/edit-detachments')}
          >
            Edit Detachments
          </Button>
        </Card>

        <Card variant="transparent" padding="lg" className={styles['menu-section']}>
          <h3>Reference</h3>
          <Button 
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate('/rules-browser')}
          >
            Rules Browser
          </Button>
        </Card>
      </div>

      <div className={styles['menu-footer']}>
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default MainMenu; 
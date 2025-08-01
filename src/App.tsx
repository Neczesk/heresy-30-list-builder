import { useState } from 'react';
import './App.css';
import MainMenu from './components/MainMenu';
import ArmyListBuilder from './components/ArmyListBuilder';
import LoadArmyList from './components/LoadArmyList';
import CustomUnitsManager from './components/CustomUnitsManager';
import CustomDetachmentsManager from './components/CustomDetachmentsManager';
import RulesBrowser from './components/RulesBrowser';
import type { Army } from './types/army';

function App() {
  const [currentView, setCurrentView] = useState<'menu' | 'newList' | 'loadList' | 'editUnits' | 'editDetachments' | 'rulesBrowser'>('menu');
  const [currentArmyList, setCurrentArmyList] = useState<Army | null>(null);

  const handleNewList = () => {
    console.log('Create New Army List clicked');
    setCurrentView('newList');
  };

  const handleLoadList = () => {
    console.log('Load Existing Army List clicked');
    setCurrentView('loadList');
  };

  const handleEditUnits = () => {
    console.log('Edit Units clicked');
    setCurrentView('editUnits');
  };

  const handleEditDetachments = () => {
    console.log('Edit Detachments clicked');
    setCurrentView('editDetachments');
  };

  const handleRulesBrowser = () => {
    console.log('Rules Browser clicked');
    setCurrentView('rulesBrowser');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setCurrentArmyList(null);
  };

  const handleLoadExistingList = (armyList: Army) => {
    setCurrentArmyList(armyList);
    setCurrentView('newList'); // Use the same view as new list
  };

  // Render different views based on currentView state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <MainMenu
            onNewList={handleNewList}
            onLoadList={handleLoadList}
            onEditUnits={handleEditUnits}
            onEditDetachments={handleEditDetachments}
            onRulesBrowser={handleRulesBrowser}
          />
        );
      case 'newList':
        return (
          <ArmyListBuilder
            onBackToMenu={handleBackToMenu}
            initialArmyList={currentArmyList}
          />
        );
      case 'loadList':
        return (
          <LoadArmyList
            onBackToMenu={handleBackToMenu}
            onLoadList={handleLoadExistingList}
          />
        );
      case 'editUnits':
        return (
          <CustomUnitsManager
            onBackToMenu={handleBackToMenu}
          />
        );
      case 'editDetachments':
        return (
          <CustomDetachmentsManager
            onBackToMenu={handleBackToMenu}
          />
        );
      case 'rulesBrowser':
        return (
          <RulesBrowser
            onBackToMenu={handleBackToMenu}
          />
        );

      default:
        return (
          <MainMenu
            onNewList={handleNewList}
            onLoadList={handleLoadList}
            onEditUnits={handleEditUnits}
            onEditDetachments={handleEditDetachments}
            onRulesBrowser={handleRulesBrowser}
          />
        );
    }
  };

  return (
    <div className="App">
      {renderCurrentView()}
    </div>
  );
}

export default App;

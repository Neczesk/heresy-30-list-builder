import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainMenu from './MainMenu';
import ArmyListBuilder from './ArmyListBuilder';
import LoadArmyList from './LoadArmyList';
import CustomUnitsManager from './CustomUnitsManager';
import CustomDetachmentsManager from './CustomDetachmentsManager';
import RulesBrowser from './RulesBrowser';
import type { Army } from '../types/army';

interface RouterProps {
  currentArmyList: Army | null;
  setCurrentArmyList: (armyList: Army | null) => void;
}

const AppRouter: React.FC<RouterProps> = ({ currentArmyList, setCurrentArmyList }) => {
  const handleLoadExistingList = (armyList: Army) => {
    setCurrentArmyList(armyList);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Main menu route */}
        <Route path="/" element={<MainMenu />} />
        
        {/* Army list builder route */}
        <Route 
          path="/army-builder" 
          element={
            <ArmyListBuilder
              initialArmyList={currentArmyList}
            />
          } 
        />
        
        {/* Load army list route */}
        <Route 
          path="/load-list" 
          element={
            <LoadArmyList
              onLoadList={handleLoadExistingList}
            />
          } 
        />
        
        {/* Custom units manager route */}
        <Route 
          path="/edit-units" 
          element={
            <CustomUnitsManager />
          } 
        />
        
        {/* Custom detachments manager route */}
        <Route 
          path="/edit-detachments" 
          element={
            <CustomDetachmentsManager />
          } 
        />
        
        {/* Rules browser route */}
        <Route 
          path="/rules-browser" 
          element={
            <RulesBrowser />
          } 
        />
        
        {/* Catch all route - redirect to main menu */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter; 
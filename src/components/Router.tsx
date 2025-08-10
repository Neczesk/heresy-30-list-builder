import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainMenu from './MainMenu';
import ArmyListBuilder from '../pages/listBuilder/ArmyListBuilder';
import LoadArmyList from '../pages/listBuilder/LoadArmyList';
import CustomUnitsManager from '../pages/managers/CustomUnitsManager';
import CustomDetachmentsManager from '../pages/managers/CustomDetachmentsManager';
import RulesBrowser from '../pages/browser/RulesBrowser';
import CSVCreator from '../pages/csvCreator/CSVCreator';
import type { Army } from '../types/army';

interface RouterProps {
  currentArmyList: Army | null;
  setCurrentArmyList: (armyList: Army | null) => void;
}

const AppRouter: React.FC<RouterProps> = ({
  currentArmyList,
  setCurrentArmyList,
}) => {
  const handleLoadExistingList = (armyList: Army) => {
    setCurrentArmyList(armyList);
  };

  const handleClearCurrentArmyList = () => {
    setCurrentArmyList(null);
  };

  return (
    <BrowserRouter basename="/heresy-30-list-builder/">
      <Routes>
        {/* Main menu route */}
        <Route
          path="/"
          element={
            <MainMenu onClearCurrentArmyList={handleClearCurrentArmyList} />
          }
        />

        {/* Army list builder route - for creating new lists */}
        <Route
          path="/army-builder"
          element={
            <ArmyListBuilder
              initialArmyList={null}
              onClearCurrentArmyList={handleClearCurrentArmyList}
            />
          }
        />

        {/* Army list builder route - for editing existing lists */}
        <Route
          path="/army-builder/edit"
          element={
            <ArmyListBuilder
              initialArmyList={currentArmyList}
              onClearCurrentArmyList={handleClearCurrentArmyList}
            />
          }
        />

        {/* Load army list route */}
        <Route
          path="/load-list"
          element={<LoadArmyList onLoadList={handleLoadExistingList} />}
        />

        {/* Custom units manager route */}
        <Route path="/edit-units" element={<CustomUnitsManager />} />

        {/* Custom detachments manager route */}
        <Route
          path="/edit-detachments"
          element={<CustomDetachmentsManager />}
        />

        {/* Rules browser routes */}
        <Route path="/rules-browser" element={<RulesBrowser />} />
        <Route path="/rules-browser/unit-browser" element={<RulesBrowser />} />
        <Route
          path="/rules-browser/detachment-browser"
          element={<RulesBrowser />}
        />
        <Route
          path="/rules-browser/special-rules-browser"
          element={<RulesBrowser />}
        />
        <Route
          path="/rules-browser/wargear-browser"
          element={<RulesBrowser />}
        />
        <Route
          path="/rules-browser/weapon-browser"
          element={<RulesBrowser />}
        />

        {/* CSV Creator route */}
        <Route path="/csv-creator" element={<CSVCreator />} />

        {/* Catch all route - redirect to main menu */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

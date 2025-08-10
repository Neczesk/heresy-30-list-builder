import { useState } from 'react';
import AppRouter from './components/Router';
import type { Army } from './types/army';
import { CssBaseline } from '@mui/material';
import { ThemeProviderWrapper } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useLocalStorageSync } from './hooks/useLocalStorageSync';

function App() {
  const [currentArmyList, setCurrentArmyList] = useState<Army | null>(null);

  return (
    <AuthProvider>
      <AppContent
        currentArmyList={currentArmyList}
        setCurrentArmyList={setCurrentArmyList}
      />
    </AuthProvider>
  );
}

// Separate component that can use the AuthProvider context
function AppContent({
  currentArmyList,
  setCurrentArmyList,
}: {
  currentArmyList: Army | null;
  setCurrentArmyList: (army: Army | null) => void;
}) {
  // Enable automatic syncing of custom units and detachments
  useLocalStorageSync({
    enabled: true,
    onSyncStart: () => console.log('Starting localStorage sync...'),
    onSyncComplete: () => console.log('LocalStorage sync completed'),
    onSyncError: (error: Error) =>
      console.error('LocalStorage sync error:', error),
  });

  return (
    <ThemeProviderWrapper>
      <CssBaseline />
      <AppRouter
        currentArmyList={currentArmyList}
        setCurrentArmyList={setCurrentArmyList}
      />
    </ThemeProviderWrapper>
  );
}

export default App;

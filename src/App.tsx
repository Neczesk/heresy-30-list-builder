import { useState } from 'react';
import AppRouter from './components/Router';
import type { Army } from './types/army';
import { CssBaseline } from '@mui/material';
import { ThemeProviderWrapper } from './contexts/ThemeContext';

function App() {
  const [currentArmyList, setCurrentArmyList] = useState<Army | null>(null);

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

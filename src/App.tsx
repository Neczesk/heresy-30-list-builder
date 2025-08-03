import { useState } from 'react';
import AppRouter from './components/Router';
import type { Army } from './types/army';
import { CssBaseline } from '@mui/material';

function App() {
  const [currentArmyList, setCurrentArmyList] = useState<Army | null>(null);

  return (
    <CssBaseline>
      <AppRouter
        currentArmyList={currentArmyList}
        setCurrentArmyList={setCurrentArmyList}
      />
    </CssBaseline>
  );
}

export default App;

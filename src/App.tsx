import { useState } from 'react';
import './App.module.css';
import AppRouter from './components/Router';
import type { Army } from './types/army';

function App() {
  const [currentArmyList, setCurrentArmyList] = useState<Army | null>(null);

  return (
    <div className="App">
      <AppRouter 
        currentArmyList={currentArmyList}
        setCurrentArmyList={setCurrentArmyList}
      />
    </div>
  );
}

export default App;

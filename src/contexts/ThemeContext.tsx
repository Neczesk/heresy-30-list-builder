import React, { createContext, useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { themes, type ThemeName } from './themeUtils';

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDarkMode: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export const ThemeProviderWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('light');

  // Detect user's preferred color scheme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setCurrentTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial theme based on system preference
    setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    // Store in localStorage for persistence
    localStorage.setItem('preferred-theme', theme);
  };

  // Load saved theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('preferred-theme') as ThemeName;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const isDarkMode = currentTheme === 'dark' || currentTheme === 'mechanicum';

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isDarkMode }}>
      <ThemeProvider theme={themes[currentTheme]}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

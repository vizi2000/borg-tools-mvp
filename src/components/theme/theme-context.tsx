'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'neon-tech' | 'liquid-glass';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('neon-tech');

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('borg_tools_theme', newTheme);
    setThemeState(newTheme);
    
    // Apply theme class to document
    document.documentElement.className = `theme-${newTheme}`;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'neon-tech' ? 'liquid-glass' : 'neon-tech';
    setTheme(newTheme);
  };

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('borg_tools_theme') as Theme;
    if (savedTheme && (savedTheme === 'neon-tech' || savedTheme === 'liquid-glass')) {
      setThemeState(savedTheme);
      document.documentElement.className = `theme-${savedTheme}`;
    } else {
      // Default to neon-tech theme
      document.documentElement.className = 'theme-neon-tech';
    }
  }, []);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
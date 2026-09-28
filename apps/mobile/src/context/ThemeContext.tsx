import React, { createContext, useState, useEffect, useContext } from 'react';
 import { useColorScheme } from 'react-native';
 import { colorScheme } from 'nativewind';
import * as SecureStore from 'expo-secure-store';
import { THEME } from '@/lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof THEME.light;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    SecureStore.getItemAsync('themeMode').then(saved => {
      if (saved) {
       setThemeModeState(saved as ThemeMode);
       colorScheme.set(saved as ThemeMode);
     }
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    colorScheme.set(mode);
    SecureStore.setItemAsync('themeMode', mode);
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

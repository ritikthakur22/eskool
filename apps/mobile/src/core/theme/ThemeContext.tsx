import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof lightColors;
}

const lightColors = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  subText: '#6B7280',
  border: '#F3F4F6',
  primary: '#2F80ED',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  mutedSurface: '#F3F4F6',
};

const darkColors = {
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  subText: '#9CA3AF',
  border: '#374151',
  primary: '#3B82F6',
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  mutedSurface: '#374151',
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: any) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    SecureStore.getItemAsync('themeMode').then(saved => {
      if (saved) setThemeModeState(saved as ThemeMode);
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    SecureStore.setItemAsync('themeMode', mode);
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

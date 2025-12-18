import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme, MD3DarkTheme as DarkTheme } from 'react-native-paper';

type ThemeContextType = {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
};

export const ThemeContext = createContext<ThemeContextType>({ isDark: false, setIsDark: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDarkState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const theme = isDark ? DarkTheme : DefaultTheme;

  // Load dark mode preference from AsyncStorage on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkState(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Save dark mode preference to AsyncStorage when it changes
  const setIsDark = async (isDarkValue: boolean) => {
    try {
      setIsDarkState(isDarkValue);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(isDarkValue));
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

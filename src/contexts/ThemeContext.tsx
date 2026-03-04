import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { lightTheme, darkTheme } from '../theme/theme';
import { PaperProvider } from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractColorsFromImage, ExtractedColors } from '../services/colorExtractor';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  theme: any;
  dynamicThemeEnabled: boolean;
  setDynamicThemeEnabled: (enabled: boolean) => void;
  updateDynamicColors: (artworkUrl: string | null) => void;
  showBottomNavLabels: boolean;
  setShowBottomNavLabels: (show: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [dynamicThemeEnabled, setDynamicThemeEnabledState] = useState<boolean>(false);
  const [dynamicColors, setDynamicColors] = useState<ExtractedColors | null>(null);
  const [currentArtwork, setCurrentArtwork] = useState<string | null>(null);
  const [showBottomNavLabels, setShowBottomNavLabelsState] = useState<boolean>(true);
  
  const THEME_KEY = 'theme:isDark';
  const DYNAMIC_THEME_KEY = 'theme:dynamicEnabled';
  const SHOW_LABELS_KEY = 'meta:showBottomNavLabels';

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(THEME_KEY);
        if (v !== null) {
          setIsDark(v === '1');
        }
        const dynamicEnabled = await AsyncStorage.getItem(DYNAMIC_THEME_KEY);
        if (dynamicEnabled !== null) {
          setDynamicThemeEnabledState(dynamicEnabled === '1');
        }
        const showLabels = await AsyncStorage.getItem(SHOW_LABELS_KEY);
        if (showLabels !== null) {
          try {
            const parsed = JSON.parse(showLabels);
            if (typeof parsed === 'boolean') {
              setShowBottomNavLabelsState(parsed);
            }
          } catch {
            // If it's not JSON, try as string
            setShowBottomNavLabelsState(showLabels === 'true' || showLabels === '1');
          }
        }
      } catch (e) {
        console.warn('Failed to load theme preference', e);
      }
    })();
  }, []);

  // Re-extract colors when isDark changes and dynamic theme is enabled
  useEffect(() => {
    if (dynamicThemeEnabled && currentArtwork) {
      extractColorsFromImage(currentArtwork, isDark).then(setDynamicColors);
    }
  }, [isDark, dynamicThemeEnabled, currentArtwork]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        AsyncStorage.setItem(THEME_KEY, next ? '1' : '0');
      } catch (e) {
        console.warn('Failed to save theme preference', e);
      }
      return next;
    });
  };

  const setDynamicThemeEnabled = useCallback((enabled: boolean) => {
    setDynamicThemeEnabledState(enabled);
    try {
      AsyncStorage.setItem(DYNAMIC_THEME_KEY, enabled ? '1' : '0');
    } catch (e) {
      console.warn('Failed to save dynamic theme preference', e);
    }
    // Clear dynamic colors if disabled
    if (!enabled) {
      setDynamicColors(null);
      setCurrentArtwork(null);
    }
  }, []);

  const updateDynamicColors = useCallback(async (artworkUrl: string | null) => {
    if (!dynamicThemeEnabled) return;
    
    setCurrentArtwork(artworkUrl);
    
    if (!artworkUrl) {
      setDynamicColors(null);
      return;
    }

    try {
      const colors = await extractColorsFromImage(artworkUrl, isDark);
      setDynamicColors(colors);
    } catch (e) {
      console.warn('Failed to extract colors from artwork', e);
      setDynamicColors(null);
    }
  }, [dynamicThemeEnabled, isDark]);

  const setShowBottomNavLabels = useCallback((show: boolean) => {
    setShowBottomNavLabelsState(show);
    try {
      AsyncStorage.setItem(SHOW_LABELS_KEY, JSON.stringify(show));
    } catch (e) {
      console.warn('Failed to save bottom nav labels preference', e);
    }
  }, []);

  // Build the final theme by merging base theme with dynamic colors
  const baseTheme = isDark ? darkTheme : lightTheme;
  const theme = dynamicThemeEnabled && dynamicColors
    ? {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          primary: dynamicColors.primary,
          secondary: dynamicColors.secondary,
          primaryContainer: dynamicColors.primary + '20', // 20% opacity
          secondaryContainer: dynamicColors.secondary + '20',
          onPrimary: dynamicColors.onPrimary,
          onPrimaryContainer: dynamicColors.primary,
          onSecondaryContainer: dynamicColors.secondary,
        },
      }
    : baseTheme;

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      toggleTheme, 
      theme, 
      dynamicThemeEnabled, 
      setDynamicThemeEnabled,
      updateDynamicColors,
      showBottomNavLabels,
      setShowBottomNavLabels
    }}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};
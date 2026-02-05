import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    surface: '#FFFBFE',
    background: '#FFFBFE',
    surfaceVariant: '#E7E0EC',
    onSurface: '#1C1B1F',
    onBackground: '#1C1B1F',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    scrim: '#000000',
    elevation: {
      level0: 'transparent',
      level1: '#F5EEFA',
      level2: '#EEE7F5',
      level3: '#E8E0F0',
      level4: '#E2D8EB',
      level5: '#DCCFE6',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    secondary: '#CCC2DC',
    tertiary: '#EFB8C8',
    surface: '#141218',
    background: '#141218',
    surfaceVariant: '#49454F',
    onSurface: '#E6E1E5',
    onBackground: '#E6E1E5',
    onPrimary: '#381E72',
    onSecondary: '#332D41',
    onTertiary: '#492532',
    outline: '#938F99',
    outlineVariant: '#49454F',
    scrim: '#000000',
    elevation: {
      level0: 'transparent',
      level1: '#1F1A23',
      level2: '#2A242E',
      level3: '#342F38',
      level4: '#3F3943',
      level5: '#4A434E',
    },
  },
};
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
  ios: 'System',
  default: 'Roboto',
});

const createFontConfig = (baseFonts: any) => ({
  displayLarge: { ...baseFonts.displayLarge, fontFamily },
  displayMedium: { ...baseFonts.displayMedium, fontFamily },
  displaySmall: { ...baseFonts.displaySmall, fontFamily },
  headlineLarge: { ...baseFonts.headlineLarge, fontFamily },
  headlineMedium: { ...baseFonts.headlineMedium, fontFamily },
  headlineSmall: { ...baseFonts.headlineSmall, fontFamily },
  titleLarge: { ...baseFonts.titleLarge, fontFamily },
  titleMedium: { ...baseFonts.titleMedium, fontFamily },
  titleSmall: { ...baseFonts.titleSmall, fontFamily },
  bodyLarge: { ...baseFonts.bodyLarge, fontFamily },
  bodyMedium: { ...baseFonts.bodyMedium, fontFamily },
  bodySmall: { ...baseFonts.bodySmall, fontFamily },
  labelLarge: { ...baseFonts.labelLarge, fontFamily },
  labelMedium: { ...baseFonts.labelMedium, fontFamily },
  labelSmall: { ...baseFonts.labelSmall, fontFamily },
  default: { ...baseFonts.default, fontFamily },
});

const sharedTokens = {
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    pill: 40,
    full: 999,
  },
  typography: {
    labelSmall: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1.5 },
    titleMedium: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
    bodySmall: { fontSize: 13, lineHeight: 18 },
    miniTitle: { fontSize: 15, fontWeight: '600' as const },
    miniSubtitle: { fontSize: 13 },
    timeText: { fontSize: 12 },
  },
  sizes: {
    miniPlayerHeight: 70,
    miniPlayerCover: 52,
    miniPlayerProgress: 64,
    fullPlayerPlayButton: 64,
  },
  controls: {
    ICON_SIZES: {
      mini: 28,
      full: 48,
      fullSecondary: 28,
    },
    CONTROL_HIT_SLOP: {
      sm: 10,
      md: 12,
      lg: 14,
    },
    CONTROL_BOX: {
      sm: 44,
      md: 48,
      lg: 56,
    },
    CONTROL_SPACING: {
      mini: 16,
      full: 18,
    },
    PROGRESS_BAR: {
      mini: 5,
      full: 7,
    },
    THUMB_SIZE: {
      mini: 12,
      full: 14,
    },
    DRAG_HANDLE: {
      width: 44,
      height: 5,
      touchHeight: 36,
    },
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  fonts: createFontConfig(MD3LightTheme.fonts),
  ui: {
    ...sharedTokens,
    alpha: {
      onPrimary20: 'rgba(255, 255, 255, 0.2)',
      onPrimary30: 'rgba(255, 255, 255, 0.3)',
      onPrimary80: 'rgba(255, 255, 255, 0.8)',
    },
    shadow: {
      card: { color: '#000000', opacity: 0.1, radius: 4, elevation: 3 },
      miniPlayer: { color: '#000000', opacity: 0.3, radius: 8, elevation: 8 },
    },
  },
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
  fonts: createFontConfig(MD3DarkTheme.fonts),
  ui: {
    ...sharedTokens,
    alpha: {
      onPrimary20: 'rgba(255, 255, 255, 0.2)',
      onPrimary30: 'rgba(255, 255, 255, 0.3)',
      onPrimary80: 'rgba(255, 255, 255, 0.8)',
    },
    shadow: {
      card: { color: '#000000', opacity: 0.35, radius: 4, elevation: 3 },
      miniPlayer: { color: '#000000', opacity: 0.45, radius: 8, elevation: 8 },
    },
  },
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

import { Platform, Image } from 'react-native';

// Declare global types for web environment
declare const window: any;
declare const document: any;

export interface ExtractedColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  onPrimary: string;
  onSurface: string;
}

// Simple color manipulation utilities
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

// Calculate luminance for contrast calculation
const getLuminance = (r: number, g: number, b: number): number => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

// Determine if we should use light or dark text on a background
const shouldUseLightText = (bgHex: string): boolean => {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return true;
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance < 0.5;
};

// Generate a complementary color palette from a base color
export const generatePaletteFromColor = (baseHex: string, isDark: boolean): ExtractedColors => {
  const baseRgb = hexToRgb(baseHex);
  if (!baseRgb) {
    return getDefaultColors(isDark);
  }

  const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

  // Create primary color with good saturation
  const primaryHsl = {
    h: baseHsl.h,
    s: Math.min(80, Math.max(40, baseHsl.s)),
    l: isDark ? 70 : 40,
  };
  const primaryRgb = hslToRgb(primaryHsl.h, primaryHsl.s, primaryHsl.l);
  const primary = rgbToHex(primaryRgb.r, primaryRgb.g, primaryRgb.b);

  // Create secondary color (slightly shifted hue)
  const secondaryHsl = {
    h: (baseHsl.h + 30) % 360,
    s: Math.min(60, Math.max(30, baseHsl.s - 10)),
    l: isDark ? 65 : 45,
  };
  const secondaryRgb = hslToRgb(secondaryHsl.h, secondaryHsl.s, secondaryHsl.l);
  const secondary = rgbToHex(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);

  // Background and surface colors
  const background = isDark ? '#141218' : '#FFFBFE';
  const surfaceHsl = {
    h: baseHsl.h,
    s: isDark ? Math.min(20, baseHsl.s * 0.3) : Math.min(15, baseHsl.s * 0.2),
    l: isDark ? 12 : 98,
  };
  const surfaceRgb = hslToRgb(surfaceHsl.h, surfaceHsl.s, surfaceHsl.l);
  const surface = rgbToHex(surfaceRgb.r, surfaceRgb.g, surfaceRgb.b);

  // Text colors based on contrast
  const onPrimary = shouldUseLightText(primary) ? '#FFFFFF' : '#000000';
  const onSurface = isDark ? '#E6E1E5' : '#1C1B1F';

  return {
    primary,
    secondary,
    background,
    surface,
    onPrimary,
    onSurface,
  };
};

// Default colors when extraction fails
const getDefaultColors = (isDark: boolean): ExtractedColors => ({
  primary: isDark ? '#D0BCFF' : '#6750A4',
  secondary: isDark ? '#CCC2DC' : '#625B71',
  background: isDark ? '#141218' : '#FFFBFE',
  surface: isDark ? '#141218' : '#FFFBFE',
  onPrimary: isDark ? '#381E72' : '#FFFFFF',
  onSurface: isDark ? '#E6E1E5' : '#1C1B1F',
});

// Extract average color from image URL using Canvas (web) or simple fetch (native)
export const extractColorsFromImage = async (
  imageUrl: string,
  isDark: boolean
): Promise<ExtractedColors> => {
  if (!imageUrl) {
    return getDefaultColors(isDark);
  }

  try {
    if (Platform.OS === 'web') {
      return await extractColorsWeb(imageUrl, isDark);
    } else {
      // For native, we'll use a simple hash-based color generation
      // since proper color extraction requires native modules
      return generateColorsFromUrl(imageUrl, isDark);
    }
  } catch (error) {
    console.warn('Color extraction failed:', error);
    return getDefaultColors(isDark);
  }
};

// Web-specific color extraction using Canvas
const extractColorsWeb = async (imageUrl: string, isDark: boolean): Promise<ExtractedColors> => {
  return new Promise((resolve) => {
    // Type guard for web environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(generateColorsFromUrl(imageUrl, isDark));
      return;
    }

    const img = new (window as any).Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = (document as any).createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(getDefaultColors(isDark));
          return;
        }

        // Sample a small portion for performance
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imageData.data;

        // Calculate average color
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Skip very dark or very light pixels
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness > 20 && brightness < 235) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          const baseColor = rgbToHex(r, g, b);
          resolve(generatePaletteFromColor(baseColor, isDark));
        } else {
          resolve(getDefaultColors(isDark));
        }
      } catch (e) {
        resolve(getDefaultColors(isDark));
      }
    };

    img.onerror = () => {
      resolve(getDefaultColors(isDark));
    };

    img.src = imageUrl;
  });
};

// Generate colors from URL hash for native platforms
// This creates consistent colors per image URL without needing native modules
const generateColorsFromUrl = (url: string, isDark: boolean): ExtractedColors => {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Generate hue from hash (0-360)
  const hue = Math.abs(hash % 360);
  
  // Create base color with this hue
  const baseRgb = hslToRgb(hue, 60, isDark ? 50 : 40);
  const baseColor = rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b);
  
  return generatePaletteFromColor(baseColor, isDark);
};

export default {
  extractColorsFromImage,
  generatePaletteFromColor,
};

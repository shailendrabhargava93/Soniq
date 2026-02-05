import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onRecentlyPlayedClick?: () => void;
  onSettingsClick?: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideThemeToggle?: boolean;
}

export default function Header({ onRecentlyPlayedClick, onSettingsClick, title, showBack, onBack, hideThemeToggle }: HeaderProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const fg = theme?.colors?.onSurface || '#000';
  const bg = theme?.colors?.surface || '#fff';

  return (
    <View style={[styles.container, { backgroundColor: bg }] }>
      <View style={styles.brand}>
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showBack ? (
              <TouchableOpacity onPress={onBack} style={{ marginRight: 8 }} accessibilityRole="button" accessibilityLabel="Back">
                <MaterialIcons name="arrow-back" size={22} color={fg} />
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.title, { color: fg }]}>{title}</Text>
          </View>
        ) : (
          <>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={[styles.title, { color: fg }]}>Wave</Text>
          </>
        )}
      </View>
      <View style={styles.actions}>
        {onRecentlyPlayedClick && (
          <TouchableOpacity onPress={onRecentlyPlayedClick} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Recently played">
            <MaterialIcons name="access-time" size={22} color={fg} />
          </TouchableOpacity>
        )}
        {onSettingsClick && (
          <TouchableOpacity onPress={onSettingsClick} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Settings">
            <MaterialIcons name="settings" size={22} color={fg} />
          </TouchableOpacity>
        )}

        {/* Theme toggle button (optional) */}
        {!hideThemeToggle && (
          <TouchableOpacity onPress={toggleTheme} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
            <MaterialIcons name={isDark ? 'light-mode' : 'dark-mode'} size={22} color={fg} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#fff'
  },
  brand: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  logo: { 
    width: 35, 
    height: 35, 
    resizeMode: 'contain' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#000'
  },
  actions: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 8
  },
  actionBtn: { 
    padding: 6 
  },
});

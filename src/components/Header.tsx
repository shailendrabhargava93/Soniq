
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

export interface HeaderProps {
  onRecentlyPlayedClick?: () => void;
  onSettingsClick?: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideThemeToggle?: boolean;
  centerTitle?: boolean;
  logo?: boolean;
}

export default function Header({ onRecentlyPlayedClick, onSettingsClick, title, showBack, onBack, hideThemeToggle, centerTitle, logo }: HeaderProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const fg = theme?.colors?.onSurface || '#000';
  const bg = theme?.colors?.surface || '#fff';

  return (
    <View style={[styles.container, { backgroundColor: bg }] }>
      {centerTitle && title ? (
        <>
          <View style={styles.side}>
            {showBack ? (
              <TouchableOpacity onPress={onBack} style={{ marginRight: 8 }} accessibilityRole="button" accessibilityLabel="Back">
                <MaterialIcons name="arrow-back" size={22} color={fg} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.center}>
            <Text numberOfLines={1} style={[styles.title, { color: fg }]}>{title}</Text>
          </View>

          <View style={[styles.side, { alignItems: 'flex-end' }]}>
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
            {!hideThemeToggle && (
              <TouchableOpacity onPress={toggleTheme} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
                <MaterialIcons name={isDark ? 'light-mode' : 'dark-mode'} size={22} color={fg} />
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <>
          <View style={styles.brand}>
            {logo ? (
              <View style={{ marginLeft: -10 }}>
                <Logo width={120} height={35} />
              </View>
            ) : title ? (
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
                <Text style={[styles.title, { color: fg }]}>Soniq</Text>
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
        </>
      )}
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
  logoWide: { 
    width: 100, 
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
  side: {
    flex: 1,
    alignItems: 'flex-start'
  },
  center: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtn: { 
    padding: 6 
  },
});

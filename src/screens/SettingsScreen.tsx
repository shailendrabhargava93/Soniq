import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View, Alert, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import { Text, Switch, Button, Card, RadioButton, Portal, Dialog } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { deleteMeta, getMeta, setMeta } from '../services/storageCompat';
import Header from '../components/Header';
import packageJson from '../../package.json';

const HEADER_HEIGHT = 60;

const STREAM_QUALITIES = [
  { label: 'Low (128 kbps)', value: '128' },
  { label: 'Medium (256 kbps)', value: '256' },
  { label: 'High (320 kbps)', value: '320' },
];

type SettingItemProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress?: (() => void) | null;
  rightElement?: React.ReactNode;
  isLast?: boolean;
  subtitle?: string;
  colors: {
    surfaceVariant: string;
    primaryContainer: string;
    primary: string;
    onSurface: string;
    onSurfaceVariant: string;
  };
};

const SettingItem = memo(function SettingItem({
  icon,
  label,
  onPress,
  rightElement,
  isLast,
  subtitle,
  colors,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { borderBottomColor: colors.surfaceVariant },
        isLast && styles.settingItemLast,
      ]}
      onPress={onPress ?? undefined}
      disabled={!onPress && !rightElement}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.onSurface }]}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text> : null}
        {rightElement || <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />}
      </View>
    </TouchableOpacity>
  );
});

export default function SettingsScreen() {
  const { isDark, toggleTheme, theme, dynamicThemeEnabled, setDynamicThemeEnabled, showBottomNavLabels, setShowBottomNavLabels } = useTheme();
  const navigation = useNavigation();
  const [streamQuality, setStreamQuality] = useState('320');
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [clearSearchDialogVisible, setClearSearchDialogVisible] = useState(false);
  const [clearCacheDialogVisible, setClearCacheDialogVisible] = useState(false);

  const handleBackToHome = useCallback(() => {
    try {
      const parent = (navigation as any).getParent?.();
      if (parent?.navigate) {
        parent.navigate('Home', { screen: 'HomeMain' });
        return;
      }
      (navigation as any).navigate('Home', { screen: 'HomeMain' });
    } catch (e) {
      (navigation as any).goBack?.();
    }
  }, [navigation]);

  const loadSettings = useCallback(async () => {
    try {
      const savedQuality = await getMeta('streamQuality');
      if (savedQuality) setStreamQuality(String(savedQuality));
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
  }, []);

  // Load persisted settings
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleQualityChange = useCallback(async (quality: string) => {
    setStreamQuality(quality);
    setQualityModalVisible(false);
    try {
      await setMeta('streamQuality', quality);
      Alert.alert('Stream Quality Updated', `Quality set to ${quality} kbps`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save stream quality');
    }
  }, []);

  const clearSearchHistory = useCallback(() => {
    setClearSearchDialogVisible(true);
  }, []);

  const confirmClearSearchHistory = useCallback(async () => {
    setClearSearchDialogVisible(false);
    try {
      await deleteMeta('recentSearches');
      Alert.alert('Success', 'Search history cleared');
    } catch (e) {
      Alert.alert('Error', 'Failed to clear search history');
    }
  }, []);

  const clearCache = useCallback(() => {
    setClearCacheDialogVisible(true);
  }, []);

  const confirmClearCache = useCallback(async () => {
    setClearCacheDialogVisible(false);
    try {
      // Clear various cached data
      await Promise.all([
        deleteMeta('launch'),
        deleteMeta('chartSongs'),
        deleteMeta('chartSongsTimestamp'),
        deleteMeta('newAlbums'),
        deleteMeta('newAlbumsTimestamp'),
        deleteMeta('lastSession'),
      ]);
      Alert.alert('Success', 'Cache cleared successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to clear cache');
    }
  }, []);

  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({
        message: 'Check out Soniq - Your Music Companion! Download now.',
        title: 'Share Soniq',
        ...(Platform.OS === 'ios' && { url: 'https://soniq.app' }),
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  const openQualityDialog = useCallback(() => {
    setQualityModalVisible(true);
  }, []);

  const goToRecentlyPlayed = useCallback(() => {
    (navigation as any).navigate('RecentlyPlayed');
  }, [navigation]);

  const showAbout = useCallback(() => {
    Alert.alert('About', `Soniq - Your Music Companion\nVersion ${packageJson.version}`);
  }, []);

  const themeColors = useMemo(
    () => ({
      surfaceVariant: theme.colors.surfaceVariant,
      primaryContainer: theme.colors.primaryContainer,
      primary: theme.colors.primary,
      onSurface: theme.colors.onSurface,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
    }),
    [theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.primary, theme.colors.primaryContainer, theme.colors.surfaceVariant],
  );

  const contentContainerStyle = useMemo(
    () => [styles.scrollContent, { paddingTop: HEADER_HEIGHT + 16 }],
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
        <Header title="Settings" showBack onBack={handleBackToHome} hideThemeToggle centerTitle />
      </View>
      <ScrollView contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>APPEARANCE</Text>
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem 
            icon="dark-mode" 
            label="Dark Theme" 
            colors={themeColors}
            rightElement={<Switch value={isDark} onValueChange={toggleTheme} />}
          />
          <SettingItem 
            icon="palette" 
            label="Dynamic theme" 
            colors={themeColors}
            rightElement={<Switch value={dynamicThemeEnabled} onValueChange={setDynamicThemeEnabled} />}
          />
          <SettingItem 
            icon="label" 
            label="Toggle Labels" 
            colors={themeColors}
            rightElement={<Switch value={showBottomNavLabels} onValueChange={setShowBottomNavLabels} />}
            isLast
          />
        </Card>

        {/* Playback Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>PLAYBACK</Text>
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem 
            icon="music-note" 
            label="Stream Quality" 
            colors={themeColors}
            subtitle={`${streamQuality} kbps`}
            onPress={openQualityDialog}
          />
          <SettingItem 
            icon="delete-sweep" 
            label="Clear Search History" 
            colors={themeColors}
            onPress={clearSearchHistory}
            isLast
          />
        </Card>

        {/* Library Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>LIBRARY</Text>
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem 
            icon="history" 
            label="Recently Played" 
            colors={themeColors}
            onPress={goToRecentlyPlayed}
            isLast
          />
        </Card>

        {/* About Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>ABOUT</Text>
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem 
            icon="share" 
            label="Share App" 
            colors={themeColors}
            onPress={handleShareApp}
          />
          <SettingItem 
            icon="info" 
            label="About" 
            colors={themeColors}
            subtitle={`v${packageJson.version}`}
            onPress={showAbout}
            isLast
          />
        </Card>

        {/* Cache & Storage Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>STORAGE</Text>
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem 
            icon="delete-outline" 
            label="Clear Cache" 
            colors={themeColors}
            onPress={clearCache}
            isLast
          />
        </Card>
      </ScrollView>

      {/* Stream Quality Modal */}
      <Portal>
        <Dialog
          visible={qualityModalVisible}
          onDismiss={() => setQualityModalVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Stream Quality</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={handleQualityChange}
              value={streamQuality}
            >
              {STREAM_QUALITIES.map((quality) => (
                <TouchableOpacity
                  key={quality.value}
                  onPress={() => handleQualityChange(quality.value)}
                  style={styles.radioItem}
                >
                  <RadioButton.Android value={quality.value} />
                  <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                    {quality.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQualityModalVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Clear Search History Dialog */}
        <Dialog
          visible={clearSearchDialogVisible}
          onDismiss={() => setClearSearchDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Clear Search History</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              Are you sure you want to clear all search history?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearSearchDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmClearSearchHistory} textColor={theme.colors.error}>Clear</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Clear Cache Dialog */}
        <Dialog
          visible={clearCacheDialogVisible}
          onDismiss={() => setClearCacheDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Clear Cache</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              This will clear cached data like albums, songs, and sessions. Continue?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearCacheDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmClearCache} textColor={theme.colors.error}>Clear</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginRight: 4,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
});

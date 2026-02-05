import React from 'react';
import { View, Alert } from 'react-native';
import { Title, Switch, Button } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { deleteMeta } from '../services/storageCompat';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();

  const clearCache = async () => {
    try {
      await deleteMeta('launch');
      Alert.alert('Cache cleared');
    } catch (e) {
      Alert.alert('Error', 'Failed to clear cache');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Title>Settings</Title>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Title style={{ fontSize: 16 }}>Dark Mode</Title>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      <Button mode="outlined" onPress={clearCache} style={{ marginTop: 16 }}>Clear Cached Launch Data</Button>
      <Button mode="outlined" onPress={() => Alert.alert('About', 'Soniq - demo app')} style={{ marginTop: 8 }}>About</Button>
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { Title, Text } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

export default function RecentlyPlayed() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Title>Recently Played</Title>
      <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>Your recently played tracks will appear here.</Text>
    </View>
  );
}

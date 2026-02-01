import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  onRecentlyPlayedClick?: () => void;
  onSettingsClick?: () => void;
}

export default function Header({ onRecentlyPlayedClick, onSettingsClick }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>Wave</Text>
      </View>
      <View style={styles.actions}>
        {onRecentlyPlayedClick && (
          <TouchableOpacity onPress={onRecentlyPlayedClick} style={styles.actionBtn}>
            <Ionicons name="time-outline" size={22} color="#000" />
          </TouchableOpacity>
        )}
        {onSettingsClick && (
          <TouchableOpacity onPress={onSettingsClick} style={styles.actionBtn}>
            <Ionicons name="settings-outline" size={22} color="#000" />
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

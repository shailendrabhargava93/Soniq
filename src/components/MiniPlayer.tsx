import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, IconButton, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface MiniPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onOpenFullPlayer: () => void;
  currentSong: {
    title: string;
    artist: string;
    cover: string;
  };
  position?: number;
  duration?: number;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onOpenFullPlayer,
  currentSong,
  position = 0,
  duration = 100
}) => {
  const { theme } = useTheme();
  const progress = duration > 0 ? position / duration : 0;

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={onOpenFullPlayer} style={styles.content}>
        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: theme.colors.primary }]} />
        
        <View style={styles.mainContent}>
          {/* Album Cover */}
          <Card.Cover
            source={{ uri: currentSong.cover }}
            style={[styles.cover, { backgroundColor: theme.colors.surfaceVariant }]}
          />
          
          {/* Song Info */}
          <View style={styles.songInfo}>
            <Text 
              variant="labelMedium" 
              numberOfLines={1} 
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              {currentSong.title}
            </Text>
            <Text 
              variant="bodySmall" 
              numberOfLines={1} 
              style={[styles.artist, { color: theme.colors.onSurfaceVariant }]}
            >
              {currentSong.artist}
            </Text>
          </View>
          
          {/* Controls */}
          <View style={styles.controls}>
            <IconButton
              icon="skip-previous"
              size={24}
              onPress={onPrevious}
              iconColor={theme.colors.onSurface}
            />
            <IconButton
              icon={isPlaying ? "pause-circle" : "play-circle"}
              size={32}
              onPress={onPlayPause}
              iconColor={theme.colors.primary}
            />
            <IconButton
              icon="skip-next"
              size={24}
              onPress={onNext}
              iconColor={theme.colors.onSurface}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginBottom: 80, // Extra space for tab bar
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  progressBar: {
    height: 2,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    padding: 8,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
  },
  artist: {
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MiniPlayer;
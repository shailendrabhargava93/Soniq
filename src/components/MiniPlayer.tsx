import React from "react";
import { View, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Card } from "react-native-paper";
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Circle } from 'react-native-svg';

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
  const ui = theme.ui;
  const controls = ui.controls;
  const progress = duration > 0 ? (position / duration) * 100 : 0;
  
  // Circular progress parameters
  const size = ui.sizes.miniPlayerProgress;
  const strokeWidth = controls.PROGRESS_BAR.mini;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View
      style={[
        styles.container,
        {
          marginHorizontal: ui.spacing.sm,
          borderRadius: ui.radius.pill,
          elevation: ui.shadow.miniPlayer.elevation,
          shadowColor: ui.shadow.miniPlayer.color,
          shadowOpacity: ui.shadow.miniPlayer.opacity,
          shadowRadius: ui.shadow.miniPlayer.radius,
          height: ui.sizes.miniPlayerHeight,
        },
      ]}
    >
      {/* Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.primary, borderRadius: ui.radius.lg }]} />

      <Pressable
        onPress={onOpenFullPlayer}
        style={[styles.content, { paddingHorizontal: ui.spacing.sm, paddingVertical: ui.spacing.sm }]}
        accessibilityRole="button"
        accessibilityLabel="Open full player"
        accessible
      >
        <View style={styles.mainContent}>
          {/* Album Cover with circular progress */}
          <View style={[styles.albumArtContainer, { width: size, height: size }]}>
            <Svg width={size} height={size} style={styles.progressCircle}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={ui.alpha.onPrimary30}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={theme.colors.onPrimary}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <Card.Cover
              source={{ uri: currentSong.cover }}
              style={[
                styles.cover,
                {
                  width: ui.sizes.miniPlayerCover,
                  height: ui.sizes.miniPlayerCover,
                  borderRadius: ui.sizes.miniPlayerCover / 2,
                  backgroundColor: ui.alpha.onPrimary20,
                },
              ]}
            />
          </View>
          
          {/* Song Info */}
          <View style={[styles.songInfo, { marginLeft: ui.spacing.sm }]}>
            <Text 
              variant="labelMedium" 
              numberOfLines={1} 
              style={[
                styles.title,
                {
                  color: theme.colors.onPrimary,
                  fontSize: ui.typography.miniTitle.fontSize,
                  fontWeight: ui.typography.miniTitle.fontWeight,
                },
              ]}
            >
              {currentSong.title}
            </Text>
            <Text 
              variant="bodySmall" 
              numberOfLines={1} 
              style={[
                styles.artist,
                {
                  marginTop: ui.spacing.xxs,
                  color: ui.alpha.onPrimary80,
                  fontSize: ui.typography.miniSubtitle.fontSize,
                },
              ]}
            >
              {currentSong.artist}
            </Text>
          </View>
          
          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onPlayPause();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={isPlaying ? "pause" : "play-arrow"}
                size={32}
                color={theme.colors.onPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onNext();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginLeft: ui.spacing.sm }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="skip-next"
                size={28}
                color={theme.colors.onPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArtContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cover: {
  },
  songInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
  },
  artist: {
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MiniPlayer;

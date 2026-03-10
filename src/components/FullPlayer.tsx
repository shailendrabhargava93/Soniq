import React, { useRef } from "react";
import { Modal, View, Text, Image, Pressable, TouchableOpacity, StyleSheet, PanResponder, Animated, useWindowDimensions, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { seekTo } from '../services/audio';
import type { Track } from "../types/api";

export default function FullPlayer({ visible, onClose, track }: { visible: boolean; onClose: () => void; track?: Track | null }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const ui = theme.ui;
  const controls = ui.controls;
  const player = usePlayer();
  const { toggleSongFavorite, isSongFavorite } = useFavorites();
  const { width } = useWindowDimensions();
  
  // Calculate artwork size with constraints
  const maxArtSize = Math.min(width - 64, 500); // Max 500px or screen width - 64
  const artSize = width < 768 ? width - 64 : maxArtSize; // Mobile: full width, Desktop: constrained
  
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) pan.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120) {
          onClose();
        }
        Animated.timing(pan, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      }
    })
  ).current;

  const toggle = async () => {
    try {
      if (player.isPlaying) {
        await player.pauseSong();
      } else {
        await player.playSong();
      }
    } catch (e) {
      console.warn('[FullPlayer] toggle failed', e);
    }
  };

  const onSeek = async (sec: number) => {
    try {
      await seekTo(sec);
    } catch (e) {
      console.warn('[FullPlayer] seek failed', e);
    }
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const currentTrack = player.currentSong;
  const trackId = currentTrack?.id || '';
  const liked = isSongFavorite(trackId);
  const controlHitSlop = {
    top: controls.CONTROL_HIT_SLOP.md,
    bottom: controls.CONTROL_HIT_SLOP.md,
    left: controls.CONTROL_HIT_SLOP.md,
    right: controls.CONTROL_HIT_SLOP.md,
  };

  return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: pan }],
              backgroundColor: theme.colors.background,
              paddingTop: insets.top + ui.spacing.sm,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Pressable
            onPress={onClose}
            style={[styles.dragHandleTouch, { height: controls.DRAG_HANDLE.touchHeight }]}
            hitSlop={controlHitSlop}
            accessibilityRole="button"
            accessibilityLabel="Close full player"
            accessible
          >
            <View
              style={[
                styles.dragHandle,
                {
                  width: controls.DRAG_HANDLE.width,
                  height: controls.DRAG_HANDLE.height,
                  borderRadius: controls.DRAG_HANDLE.height / 2,
                  backgroundColor: theme.colors.outlineVariant,
                },
              ]}
            />
          </Pressable>
          {/* Header */}
          <View style={[styles.headerRow, { paddingHorizontal: ui.spacing.xxxl }]}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="keyboard-arrow-down" size={30} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text
              style={[
                styles.nowPlaying,
                {
                  color: theme.colors.onSurface,
                  fontSize: ui.typography.labelSmall.fontSize,
                  fontWeight: ui.typography.labelSmall.fontWeight,
                  letterSpacing: ui.typography.labelSmall.letterSpacing,
                },
              ]}
            >
              NOW PLAYING
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => player.toggleQueue()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="queue-music" size={22} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>

          {currentTrack ? (
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={[
                styles.content,
                {
                  width: artSize,
                  alignSelf: 'center',
                  paddingHorizontal: ui.spacing.xxxl,
                  paddingTop: ui.spacing.lg,
                  paddingBottom: ui.spacing.xxxl,
                },
              ]}
              showsVerticalScrollIndicator={false}
              >
              {/* Album Art */}
              <Image
                source={currentTrack.artwork ? { uri: currentTrack.artwork } : require('../../assets/icon.png')}
                style={[styles.art, { width: artSize, height: artSize, borderRadius: ui.radius.md, marginBottom: ui.spacing.xl + ui.spacing.sm }]}
              />

              {/* Song Info + Favorite */}
              <View style={[styles.infoRow, { marginBottom: ui.spacing.sm }]}>
                <View style={[styles.infoText, { marginRight: ui.spacing.md }]}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: theme.colors.onBackground,
                        fontSize: ui.typography.titleMedium.fontSize,
                        fontWeight: ui.typography.titleMedium.fontWeight,
                        lineHeight: ui.typography.titleMedium.lineHeight,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {currentTrack.title}
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      {
                        color: theme.colors.onSurfaceVariant,
                        fontSize: ui.typography.bodySmall.fontSize,
                        lineHeight: ui.typography.bodySmall.lineHeight,
                        marginTop: ui.spacing.xs,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {currentTrack.artist}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    if (!currentTrack?.id) return;
                    await toggleSongFavorite({
                      id: currentTrack.id,
                      title: currentTrack.title,
                      artist: currentTrack.artist,
                      artwork: currentTrack.artwork,
                      uri: currentTrack.uri,
                    });
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.favBtn, { paddingTop: ui.spacing.xs }]}
                >
                  <MaterialIcons
                    name={liked ? 'favorite' : 'favorite-border'}
                    size={24}
                    color={liked ? theme.colors.error : theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>

              {/* Progress */}
              <View style={[styles.progressRow, { marginTop: ui.spacing.md }]}>
                <Slider
                  style={{ width: '100%', height: 20 }}
                  minimumValue={0}
                  maximumValue={player.duration || 1}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.surfaceVariant}
                  thumbTintColor={theme.colors.primary}
                  value={player.position}
                  onSlidingComplete={onSeek}
                  accessibilityLabel="Seek position"
                />
              </View>
              <View style={styles.timeRow}>
                <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant, fontSize: ui.typography.timeText.fontSize }]}>{formatTime(player.position)}</Text>
                <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant, fontSize: ui.typography.timeText.fontSize }]}>{formatTime(player.duration)}</Text>
              </View>

              {/* Controls */}
              <View style={[styles.controlsRow, { marginTop: ui.spacing.xl, paddingHorizontal: ui.spacing.sm }]}>
                <TouchableOpacity
                  onPress={() => player.toggleShuffle()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name="shuffle"
                    size={24}
                    color={player.shuffle ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => player.previousSong()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="skip-previous" size={36} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggle}
                  style={[
                    styles.playButton,
                    {
                      backgroundColor: theme.colors.primary,
                      width: ui.sizes.fullPlayerPlayButton,
                      height: ui.sizes.fullPlayerPlayButton,
                      borderRadius: ui.sizes.fullPlayerPlayButton / 2,
                    },
                  ]}
                >
                  <MaterialIcons name={player.isPlaying ? 'pause' : 'play-arrow'} size={36} color={theme.colors.onPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => player.nextSong()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="skip-next" size={36} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const next = player.repeatMode === 'off' ? 'all' : player.repeatMode === 'all' ? 'one' : 'off';
                    player.setRepeatMode(next as any);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name={player.repeatMode === 'one' ? 'repeat-one' : 'repeat'}
                    size={24}
                    color={player.repeatMode !== 'off' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: theme.colors.onSurface }}>No track selected</Text>
          </View>
          )}
        </Animated.View>
      </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragHandleTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {},
  headerRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {},
  nowPlaying: {
  },
  scrollView: {
    flex: 1,
  },
  content: {
  },
  art: {
    alignSelf: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  infoText: {
    flex: 1,
  },
  title: {
  },
  subtitle: {
  },
  favBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    width: '100%',
  },
  timeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  timeText: {
  },
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

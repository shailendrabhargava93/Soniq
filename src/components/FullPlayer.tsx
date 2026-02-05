import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, PanResponder, Animated } from 'react-native';
import { IconButton } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { audioService } from '../services/audio';
import type { Track } from '../types/api';

export default function FullPlayer({ visible, onClose, track }: { visible: boolean; onClose: () => void; track?: Track | null }) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const { theme } = useTheme();
  const player = usePlayer();
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

  useEffect(() => {
    let mounted = true;
    const onStatus = (s: any) => {
      if (!mounted) return;
      setPlaying(!!s?.isPlaying);
      if (typeof s?.positionMillis === 'number') setPosition(Math.floor(s.positionMillis / 1000));
      if (typeof s?.durationMillis === 'number') setDuration(Math.floor(s.durationMillis / 1000));
    };

    if (track) {
      (async () => {
        try {
          await audioService.load(track.uri || '');
          audioService.setStatusUpdate(onStatus);
        } catch (e) {
          console.warn('[FullPlayer] load failed', e);
        }
      })();
    }

    return () => {
      mounted = false;
      audioService.unload();
      audioService.setStatusUpdate(() => {});
      setPosition(0);
      setDuration(0);
    };
  }, [track?.uri]);

  const toggle = async () => {
    try {
      if (playing) await audioService.pause();
      else await audioService.play();
    } catch (e) {
      console.warn('[FullPlayer] toggle failed', e);
    }
  };

  const onSeek = async (sec: number) => {
    try {
      await audioService.setPosition(sec * 1000);
      setPosition(sec);
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Animated.View style={[styles.container, { transform: [{ translateY: pan }] }]} {...panResponder.panHandlers}>
        <View style={styles.headerRow}>
           <IconButton icon={({ size, color }) => <MaterialIcons name="expand-more" size={size} color={color} />} onPress={onClose} size={28} iconColor={theme.colors.onSurface} />
          <Text style={[styles.nowPlaying, { color: theme.colors.onSurface }]}>NOW PLAYING</Text>
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <IconButton icon={({ size, color }) => <MaterialIcons name="queue-music" size={size} color={color} />} onPress={() => player.toggleQueue()} size={24} iconColor={theme.colors.onSurface} />
             <IconButton icon={({ size, color }) => <MaterialIcons name="more-vert" size={size} color={color} />} onPress={() => {
               if (track) player.addToQueue(track);
             }} size={24} iconColor={theme.colors.onSurface} />
           </View>
        </View>

        {track ? (
          <View style={styles.content}>
            <Image source={ track.artwork ? { uri: track.artwork } : require('../../assets/icon.png') } style={styles.art} />
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={styles.title} numberOfLines={2}>{track.title}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>{track.artist}</Text>
            </View>

            <View style={styles.progressRow}>
              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={duration || 1}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor="#333"
                thumbTintColor={theme.colors.primary}
                value={position}
                onValueChange={(v) => setPosition(Math.floor(v))}
                onSlidingComplete={onSeek}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.controlsRow}>
                <IconButton icon={({ size, color }) => <MaterialIcons name="shuffle" size={size} color={player.shuffle ? theme.colors.primary : color} />} onPress={() => player.toggleShuffle()} />
                <IconButton icon={({ size, color }) => <MaterialIcons name="skip-previous" size={size} color={color} />} iconColor={theme.colors.onSurface} size={36} onPress={() => player.previousSong()} />
                <TouchableOpacity onPress={toggle} style={[styles.playButton, { backgroundColor: theme.colors.primary }] }>
                  <MaterialIcons name={playing ? 'pause' : 'play-arrow'} size={36} color={theme.colors.onPrimary || '#fff'} />
                </TouchableOpacity>
                <IconButton icon={({ size, color }) => <MaterialIcons name="skip-next" size={size} color={color} />} iconColor={theme.colors.onSurface} size={36} onPress={() => player.nextSong()} />
                <IconButton icon={({ size, color }) => <MaterialIcons name="repeat" size={size} color={player.repeatMode !== 'off' ? theme.colors.primary : color} />} iconColor={theme.colors.onSurface} onPress={() => {
                  const next = player.repeatMode === 'off' ? 'all' : player.repeatMode === 'all' ? 'one' : 'off';
                  player.setRepeatMode(next as any);
                }} />
            </View>

            <TouchableOpacity style={[styles.upNextBtn, { backgroundColor: theme.colors.surface }]} onPress={() => player.toggleQueue()}>
              <Text style={[styles.upNextText, { color: theme.colors.onSurface }]}>Up Next ({player.queue.length})</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff' }}>No track selected</Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  closeBtn: { position: 'absolute', left: 16, top: 40 },
  art: { width: 260, height: 260, borderRadius: 8, marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  playBtn: { padding: 12, backgroundColor: '#eee', borderRadius: 8 },
  headerRow: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  nowPlaying: { color: '#fff', fontSize: 12, letterSpacing: 1, marginTop: 4 },
  content: { alignItems: 'center', paddingHorizontal: 20, flex: 1 },
  progressRow: { width: '100%', marginTop: 18, paddingHorizontal: 6 },
  timeRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 6 },
  timeText: { color: '#90A4AE', fontSize: 12 },
  controlsRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 18 },
  playButton: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 28, fontWeight: '700' },
  upNextBtn: { marginTop: 20, width: '90%', backgroundColor: '#32414A', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  upNextText: { color: '#fff', fontWeight: '600' }
  ,
  subtitle: { color: '#B0BEC5', fontSize: 13, marginTop: 4, textAlign: 'center' }
});

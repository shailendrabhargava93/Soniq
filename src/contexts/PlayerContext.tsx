import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Track } from '../types/api';
import FullPlayer from '../components/FullPlayer';
import MiniPlayer from '../components/MiniPlayer';
import UpNextDrawer from '../components/UpNextDrawer';
import { audioService } from '../services/audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';
import { getMeta, setMeta } from '../services/storageCompat';

type RepeatMode = 'off' | 'one' | 'all';

type PlayerContextValue = {
  open: (t: Track) => void;
  close: () => void;
  visible: boolean;
  track: Track | null;
  currentSong: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  playSong: (song?: Track) => void;
  pauseSong: () => void;
  nextSong: () => void;
  previousSong: () => void;
  queue: Track[];
  addToQueue: (song: Track, atNext?: boolean) => void;
  removeFromQueue: (idx: number) => void;
  clearQueue: () => void;
  playNext: (song: Track) => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: RepeatMode;
  setRepeatMode: (m: RepeatMode) => void;
  showQueue: boolean;
  toggleQueue: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { updateDynamicColors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [showQueue, setShowQueue] = useState(false);
  const isMounted = useRef(true);

  const STORAGE_KEY = 'player:state.v1';

  // Update dynamic theme colors when current song changes
  useEffect(() => {
    if (currentSong?.artwork) {
      updateDynamicColors(currentSong.artwork);
    } else {
      updateDynamicColors(null);
    }
  }, [currentSong?.artwork, updateDynamicColors]);

  useEffect(() => {
    isMounted.current = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.queue)) setQueue(parsed.queue);
          if (typeof parsed.queueIndex === 'number') setQueueIndex(parsed.queueIndex);
          if (parsed.currentSong) setCurrentSong(parsed.currentSong);
        }
      } catch (e) {
        console.warn('Failed to restore player state', e);
      }
    })();

    // subscribe to audio status updates
    audioService.setStatusUpdate((status: any) => {
      setIsPlaying(!!status?.isPlaying);
      if (typeof status?.positionMillis === 'number') {
        setPosition(Math.floor(status.positionMillis / 1000));
      }
      if (typeof status?.durationMillis === 'number') {
        setDuration(Math.floor(status.durationMillis / 1000));
      }
      // when playback finishes, advance
      if (status?.didJustFinish) {
        handleTrackEnd();
      }
    });

    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // persist minimal state
    (async () => {
      try {
        const payload = JSON.stringify({ queue, queueIndex, currentSong });
        await AsyncStorage.setItem(STORAGE_KEY, payload);
      } catch (e) {
        // ignore
      }
    })();
  }, [queue, queueIndex, currentSong]);

  const open = (t: Track) => {
    setTrack(t);
    setVisible(true);
    // ensure current song is set and in queue
    ensureSongInQueue(t, true);
  };

  const close = () => setVisible(false);

  const ensureSongInQueue = (song: Track, setAsCurrent = false) => {
    setQueue((q) => {
      const idx = q.findIndex((s) => s.id === song.id);
      if (idx === -1) {
        const next = [...q, song];
        if (setAsCurrent) setQueueIndex(next.length - 1);
        return next;
      }
      if (setAsCurrent) setQueueIndex(idx);
      return q;
    });
    if (setAsCurrent) setCurrentSong(song);
  };

  const addToRecentlyPlayed = async (song: Track) => {
    const MAX_RECENT = 50;
    try {
      const raw = await getMeta('recentlyPlayed');
      let recent: Track[] = Array.isArray(raw) ? raw : [];
      const entry: Track = { ...song, playedAt: Date.now() };
      // Remove duplicate if exists
      recent = recent.filter((s) => s.id !== entry.id);
      // Add to beginning
      recent.unshift(entry);
      // Limit to max
      if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
      // Save through storageCompat to use consistent key
      await setMeta('recentlyPlayed', recent);
    } catch (e) {
      console.warn('Failed to save recently played', e);
    }
  };

  const playSong = async (song?: Track) => {
    try {
      if (song) {
        // play specific track and set index
        setCurrentSong(song);
        ensureSongInQueue(song, true);
        await audioService.load(song.uri || '');
        await audioService.play();
        // Track in recently played
        await addToRecentlyPlayed(song);
      } else if (queueIndex >= 0 && queue[queueIndex]) {
        const s = queue[queueIndex];
        setCurrentSong(s);
        await audioService.load(s.uri || '');
        await audioService.play();
        // Track in recently played
        await addToRecentlyPlayed(s);
      } else if (currentSong) {
        await audioService.play();
      }
    } catch (e) {
      console.warn('playSong failed', e);
    }
  };

  const pauseSong = async () => {
    try { await audioService.pause(); } catch (e) { console.warn(e); }
  };

  const playIndex = async (idx: number) => {
    if (idx < 0 || idx >= queue.length) return;
    setQueueIndex(idx);
    const s = queue[idx];
    setCurrentSong(s);
    try {
      await audioService.load(s.uri || '');
      await audioService.play();
      await addToRecentlyPlayed(s);
    } catch (e) { console.warn('playIndex failed', e); }
  };

  const handleTrackEnd = async () => {
    if (repeatMode === 'one') {
      // replay current
      if (currentSong) {
        await audioService.setPosition(0);
        await audioService.play();
      }
      return;
    }

    let nextIdx = queueIndex + 1;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }

    if (nextIdx >= 0 && nextIdx < queue.length) {
      await playIndex(nextIdx);
    } else if (repeatMode === 'all' && queue.length > 0) {
      await playIndex(0);
    } else {
      // no next, stop
      setIsPlaying(false);
      try { await audioService.unload(); } catch (e) {}
    }
  };

  const nextSong = async () => {
    if (queue.length === 0) return;
    if (shuffle) {
      const idx = Math.floor(Math.random() * queue.length);
      await playIndex(idx);
      return;
    }
    const nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      // If repeat all, go to first; otherwise stay at current
      if (repeatMode === 'all') {
        await playIndex(0);
      }
    } else {
      await playIndex(nextIdx);
    }
  };

  const previousSong = async () => {
    if (queue.length === 0) return;
    // if within 5s, go previous; otherwise restart
    try {
      const status: any = (audioService as any).status || null;
      const pos = status?.positionMillis || 0;
      if (pos > 5000) {
        await audioService.setPosition(0);
        return;
      }
    } catch (e) {}
    const prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      // Wrap to last song if repeat all
      if (repeatMode === 'all') {
        await playIndex(queue.length - 1);
      } else {
        await playIndex(0); // Restart current song
      }
    } else {
      await playIndex(prevIdx);
    }
  };

  const addToQueue = (song: Track, atNext = false) => {
    setQueue((q) => {
      const exists = q.some((s) => s.id === song.id);
      if (exists) return q;
      const next = [...q];
      if (atNext && queueIndex >= 0) next.splice(queueIndex + 1, 0, song);
      else next.push(song);
      return next;
    });
  };

  const playNext = (song: Track) => addToQueue(song, true);

  const removeFromQueue = (idx: number) => {
    setQueue((q) => {
      const next = [...q];
      if (idx < 0 || idx >= next.length) return q;
      next.splice(idx, 1);
      // adjust queueIndex if needed
      setQueueIndex((qi) => {
        if (qi === -1) return -1;
        if (idx < qi) return qi - 1;
        if (idx === qi) return Math.min(qi, next.length - 1);
        return qi;
      });
      return next;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setQueueIndex(-1);
  };

  const toggleShuffle = () => setShuffle((s) => !s);
  const toggleQueue = () => setShowQueue((v) => !v);

  return (
    <PlayerContext.Provider value={{ 
      open, 
      close, 
      visible, 
      track,
      currentSong,
      isPlaying,
      position,
      duration,
      playSong,
      pauseSong,
      nextSong,
      previousSong,
      queue,
      addToQueue,
      removeFromQueue,
      clearQueue,
      playNext,
      shuffle,
      toggleShuffle,
      repeatMode,
      setRepeatMode,
      showQueue,
      toggleQueue
    }}>
      {children}
      {currentSong && !visible && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            isPlaying={isPlaying}
            position={position}
            duration={duration}
            onPlayPause={() => isPlaying ? pauseSong() : playSong(currentSong)}
            onNext={nextSong}
            onPrevious={previousSong}
            onOpenFullPlayer={() => currentSong && open(currentSong)}
            currentSong={{
              title: currentSong.title || 'Unknown',
              artist: currentSong.artist || 'Unknown Artist',
              cover: currentSong.artwork || ''
            }}
          />
        </View>
      )}
      <FullPlayer visible={visible} onClose={close} track={track} />
      <UpNextDrawer visible={showQueue} onClose={() => setShowQueue(false)} />
    </PlayerContext.Provider>
  );
}

const styles = StyleSheet.create({
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 86,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 20,
  }
});

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

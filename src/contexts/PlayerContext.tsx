import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Track } from '../types/api';
import FullPlayer from '../components/FullPlayer';
import MiniPlayer from '../components/MiniPlayer';
import UpNextDrawer from '../components/UpNextDrawer';
import {
  setupTrackPlayer,
  setFullQueue,
  play,
  pause,
  stop,
  seekTo,
  skipToIndex,
  syncRepeatMode,
  type RNTPTrack,
} from '../services/audio';
import { useTrackPlayerEvents, Event, State } from '../hooks/useTrackPlayerBridge';
import { useAudioProgress } from '../hooks/useAudioProgress';
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
  recentlyPlayed: Track[];
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { updateDynamicColors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [showQueue, setShowQueue] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const isMounted = useRef(true);

  // Refs to avoid stale closures in RNTP event handlers
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const shuffleRef = useRef(shuffle);
  const repeatModeRef = useRef(repeatMode);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  // RNTP progress (position/duration in seconds)
  const { position, duration } = useAudioProgress(200);

  // Forward refs — assigned after functions are defined so event handlers always invoke latest version
  const handleTrackEndRef = useRef<() => void>(() => {});
  const nextSongRef = useRef<() => void>(() => {});
  const previousSongRef = useRef<() => void>(() => {});

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

    // Initialise TrackPlayer once
    setupTrackPlayer();

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

    (async () => {
      try {
        const recent = await getMeta('recentlyPlayed');
        if (Array.isArray(recent)) {
          setRecentlyPlayed(recent);
        }
      } catch (e) {
        console.warn('Failed to load recently played', e);
      }
    })();

    return () => { isMounted.current = false; };
  }, []);

  // Sync playback state and handle remote controls from notification / lock screen
  useTrackPlayerEvents(
    [
      Event.PlaybackState,
      Event.PlaybackQueueEnded,
      Event.RemotePlay,
      Event.RemotePause,
      Event.RemoteStop,
      Event.RemoteNext,
      Event.RemotePrevious,
      Event.RemoteSeek,
      Event.PlaybackActiveTrackChanged,
    ],
    async (event) => {
      switch (event.type) {
        case Event.PlaybackState:
          setIsPlaying(event.state === State.Playing);
          break;

        case Event.PlaybackQueueEnded:
          // Current track finished — advance via app queue logic
          handleTrackEndRef.current();
          break;

        case Event.RemotePlay:
          await play();
          break;

        case Event.RemotePause:
          await pause();
          break;

        case Event.RemoteStop:
          await stop();
          setIsPlaying(false);
          break;

        case Event.RemoteNext:
          nextSongRef.current();
          break;

        case Event.RemotePrevious:
          previousSongRef.current();
          break;

        case Event.RemoteSeek:
          await seekTo((event as any).position);
          break;

        case Event.PlaybackActiveTrackChanged: {
          // Fired when RNTP internally changes track (e.g. from notification skip)
          // We load one track at a time so this fires after our own skips — no action needed.
          break;
        }
      }
    }
  );

  // Sync repeat mode to RNTP so notification respects it
  useEffect(() => {
    syncRepeatMode(repeatMode).catch(() => {});
  }, [repeatMode]);

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
    const entry: Track = { ...song, playedAt: Date.now() };
    
    setRecentlyPlayed((prev) => {
      let recent = [...prev];
      // Remove duplicate if exists
      recent = recent.filter((s) => s.id !== entry.id);
      // Add to beginning
      recent.unshift(entry);
      // Limit to max
      if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
      
      // Update storage
      setMeta('recentlyPlayed', recent).catch(e => console.warn('Failed to save recently played', e));
      
      return recent;
    });
  };

  // Map our Track[] to RNTP format
  const toRNTPTrack = (t: Track): RNTPTrack => ({
    id: t.id,
    url: t.uri || '',
    title: t.title,
    artist: t.artist || 'Unknown Artist',
    artwork: t.artwork || t.image,
  });

  const playSong = async (song?: Track) => {
    try {
      if (song && song.id !== currentSong?.id) {
        // New song — load and play from the start
        setCurrentSong(song);
        ensureSongInQueue(song, true);
        const rnTrack = toRNTPTrack(song);
        await setFullQueue([rnTrack], 0);
        await play();
        setIsPlaying(true);
        await addToRecentlyPlayed(song);
      } else if (!song && queueIndex >= 0 && queue[queueIndex] && queue[queueIndex].id !== currentSong?.id) {
        // Different queue song — load and play
        const s = queue[queueIndex];
        setCurrentSong(s);
        const rnTrack = toRNTPTrack(s);
        await setFullQueue([rnTrack], 0);
        await play();
        setIsPlaying(true);
        await addToRecentlyPlayed(s);
      } else {
        // Same song already loaded — just resume
        await play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('playSong failed', e);
    }
  };

  const pauseSong = async () => {
    try {
      await pause();
      setIsPlaying(false);
    } catch (e) { console.warn(e); }
  };

  const playIndex = async (idx: number) => {
    if (idx < 0 || idx >= queue.length) return;
    setQueueIndex(idx);
    const s = queue[idx];
    setCurrentSong(s);
    try {
      const rnTrack = toRNTPTrack(s);
      await setFullQueue([rnTrack], 0);
      await play();
      setIsPlaying(true);
      await addToRecentlyPlayed(s);
    } catch (e) { console.warn('playIndex failed', e); }
  };

  const handleTrackEnd = async () => {
    if (repeatMode === 'one') {
      if (currentSong) {
        await seekTo(0);
        await play();
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
      try { await stop(); } catch (e) {}
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
      const pos = position * 1000; // position is in seconds from useProgress
      if (pos > 5000) {
        await seekTo(0);
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

  // Keep forward refs up-to-date on every render so the RNTP event handler always calls latest versions
  handleTrackEndRef.current = handleTrackEnd;
  nextSongRef.current = nextSong;
  previousSongRef.current = previousSong;

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
      toggleQueue,
      recentlyPlayed
    }}>
      {children}
      {currentSong && !visible && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            isPlaying={isPlaying}
            position={position}
            duration={duration}
            onPlayPause={() => isPlaying ? pauseSong() : playSong()}
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

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Track } from '../types/api';
import FullPlayer from '../components/FullPlayer';
import UpNextDrawer from '../components/UpNextDrawer';
import { audioService } from '../services/audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RepeatMode = 'off' | 'one' | 'all';

type PlayerContextValue = {
  open: (t: Track) => void;
  close: () => void;
  visible: boolean;
  track: Track | null;
  currentSong: Track | null;
  isPlaying: boolean;
  playSong: (song?: Track) => void;
  pauseSong: () => void;
  nextSong: () => void;
  previousSong: () => void;
  queue: Track[];
  addToQueue: (song: Track, atNext?: boolean) => void;
  removeFromQueue: (idx: number) => void;
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
  const [visible, setVisible] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [showQueue, setShowQueue] = useState(false);
  const isMounted = useRef(true);

  const STORAGE_KEY = 'player:state.v1';

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

  const playSong = async (song?: Track) => {
    try {
      if (song) {
        // play specific track and set index
        setCurrentSong(song);
        ensureSongInQueue(song, true);
        await audioService.load(song.uri || '');
        await audioService.play();
      } else if (queueIndex >= 0 && queue[queueIndex]) {
        const s = queue[queueIndex];
        setCurrentSong(s);
        await audioService.load(s.uri || '');
        await audioService.play();
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
    if (shuffle) {
      const idx = Math.floor(Math.random() * queue.length);
      await playIndex(idx);
      return;
    }
    await playIndex(queueIndex + 1);
  };

  const previousSong = async () => {
    // if within 5s, go previous; otherwise restart
    try {
      const status: any = (audioService as any).status || null;
      const pos = status?.positionMillis || 0;
      if (pos > 5000) {
        await audioService.setPosition(0);
        return;
      }
    } catch (e) {}
    await playIndex(Math.max(0, queueIndex - 1));
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
      playSong,
      pauseSong,
      nextSong,
      previousSong,
      queue,
      addToQueue,
      removeFromQueue,
      playNext,
      shuffle,
      toggleShuffle,
      repeatMode,
      setRepeatMode,
      showQueue,
      toggleQueue
    }}>
      {children}
      <FullPlayer visible={visible} onClose={close} track={track} />
      <UpNextDrawer visible={showQueue} onClose={() => setShowQueue(false)} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

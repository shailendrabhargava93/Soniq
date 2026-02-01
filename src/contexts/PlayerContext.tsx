import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Track } from '../types/api';
import FullPlayer from '../components/FullPlayer';

type PlayerContextValue = {
  open: (t: Track) => void;
  close: () => void;
  visible: boolean;
  track: Track | null;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);

  const open = (t: Track) => {
    setTrack(t);
    setVisible(true);
  };
  const close = () => {
    setVisible(false);
  };

  return (
    <PlayerContext.Provider value={{ open, close, visible, track }}>
      {children}
      <FullPlayer visible={visible} onClose={close} track={track} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

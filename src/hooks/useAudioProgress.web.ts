// Web: derive position/duration from expo-av via the audio.web.ts singleton
import { useState, useEffect } from 'react';
// Import explicitly from the web implementation so TypeScript resolves the correct types
import { addProgressListener } from '../services/audio.web';

export function useAudioProgress(_interval?: number) {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const remove = addProgressListener((pos: number, dur: number, _isPlaying: boolean) => {
      setPosition(pos);
      setDuration(dur);
    });
    return remove;
  }, []);

  return { position, duration, buffered: 0 };
}

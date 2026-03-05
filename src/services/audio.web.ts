/**
 * Web implementation of the audio service using expo-av.
 * Webpack resolves this file instead of audio.ts on the web platform.
 * The API surface is identical so PlayerContext works unchanged.
 */
import { Audio } from 'expo-av';

export type RNTPTrack = {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
};

// Singleton sound instance
let _sound: Audio.Sound | null = null;
let _progressListeners: Array<(pos: number, dur: number, isPlaying: boolean) => void> = [];

function notifyProgress(posMs: number, durMs: number, isPlaying: boolean) {
  const pos = posMs / 1000;
  const dur = durMs / 1000;
  _progressListeners.forEach((fn) => fn(pos, dur, isPlaying));
}

async function _load(url: string) {
  if (_sound) {
    await _sound.unloadAsync().catch(() => {});
    _sound = null;
  }
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
  } catch (_) {}
  const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
  _sound = sound;
  _sound.setOnPlaybackStatusUpdate((status: any) => {
    if (status.isLoaded) {
      notifyProgress(status.positionMillis ?? 0, status.durationMillis ?? 0, !!status.isPlaying);
    }
  });
}

// ─── Exported API (mirrors audio.ts) ─────────────────────────────────────────

export async function setupTrackPlayer() {
  // no-op on web — expo-av needs no global setup
}

export async function setFullQueue(tracks: RNTPTrack[], startIndex: number) {
  const track = tracks[startIndex] ?? tracks[0];
  if (!track) return;
  await _load(track.url);
}

export async function play() {
  await _sound?.playAsync();
}

export async function pause() {
  await _sound?.pauseAsync();
}

export async function stop() {
  await _sound?.stopAsync();
}

export async function seekTo(seconds: number) {
  await _sound?.setPositionAsync(seconds * 1000);
}

export async function skipToIndex(_index: number) {
  // Queue management is handled entirely in PlayerContext on web
}

export async function syncRepeatMode(_mode: 'off' | 'one' | 'all') {
  // Repeat is handled in PlayerContext on web — expo-av doesn't have queue repeat
}

export async function getActiveIndex(): Promise<number | null | undefined> {
  return null;
}

/** Register a callback that receives (positionSec, durationSec, isPlaying) updates */
export function addProgressListener(fn: (pos: number, dur: number, isPlaying: boolean) => void) {
  _progressListeners.push(fn);
  return () => {
    _progressListeners = _progressListeners.filter((l) => l !== fn);
  };
}

export { };

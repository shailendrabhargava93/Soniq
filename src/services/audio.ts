import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
} from 'react-native-track-player';

export type RNTPTrack = {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
};

let isPlayerSetup = false;

/**
 * Call once at app startup. Safe to call multiple times (idempotent).
 */
export async function setupTrackPlayer() {
  if (isPlayerSetup) return;
  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
    });
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 200,
    });
    isPlayerSetup = true;
  } catch (e: any) {
    // "The player has already been initialized" is expected on fast refresh
    if (!e?.message?.includes('already')) {
      console.warn('[TrackPlayer] setup error:', e);
    } else {
      isPlayerSetup = true;
    }
  }
}

/**
 * Set the full playback queue and jump to the desired index.
 * The notification will show the active track with prev/next controls.
 */
export async function setFullQueue(tracks: RNTPTrack[], startIndex: number) {
  await TrackPlayer.reset();
  if (tracks.length === 0) return;
  await TrackPlayer.add(tracks);
  if (startIndex > 0 && startIndex < tracks.length) {
    await TrackPlayer.skip(startIndex);
  }
}

export async function play() {
  await TrackPlayer.play();
}

export async function pause() {
  await TrackPlayer.pause();
}

export async function stop() {
  await TrackPlayer.stop();
}

export async function seekTo(seconds: number) {
  await TrackPlayer.seekTo(seconds);
}

export async function skipToIndex(index: number) {
  await TrackPlayer.skip(index);
}

export async function syncRepeatMode(mode: 'off' | 'one' | 'all') {
  const map = {
    off: RepeatMode.Off,
    one: RepeatMode.Track,
    all: RepeatMode.Queue,
  } as const;
  await TrackPlayer.setRepeatMode(map[mode]);
}

export async function getActiveIndex(): Promise<number | null | undefined> {
  return TrackPlayer.getActiveTrackIndex();
}

export { State, Event };

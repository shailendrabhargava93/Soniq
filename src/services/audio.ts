import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
} from 'react-native-track-player';
import { Platform } from 'react-native';

export type RNTPTrack = {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
};

let isPlayerSetup = false;
let setupPromise: Promise<void> | null = null;

/**
 * Call once at app startup. Safe to call multiple times (idempotent).
 */
export async function setupTrackPlayer() {
  if (isPlayerSetup) return;
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });
      
      // Configure options for both notification and in-app controls
      await TrackPlayer.updateOptions({
        // Basic capabilities for in-app controls
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        
        // Notification panel capabilities (lock screen + notification drawer)
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        
        // Compact capabilities for minimal notification display
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        
        // Progress update frequency (affects responsiveness)
        progressUpdateEventInterval: 200,
        
        // Android-specific settings
        ...(Platform.OS === 'android' && {
          // Allow non-linear playback (enables skip to any track in queue)
          requiresLinearPlayback: false,
          // Show artwork in notification
          alwaysPauseOnInterruption: true,
        }),
        
        // iOS-specific settings
        ...(Platform.OS === 'ios' && {
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
            Capability.Stop,
          ],
        }),
      });
      
      isPlayerSetup = true;
      console.debug('[TrackPlayer] Setup completed successfully');
    } catch (e: any) {
      // "The player has already been initialized" is expected on fast refresh.
      if (!e?.message?.includes('already')) {
        console.warn('[TrackPlayer] setup error:', e);
      }
      isPlayerSetup = true;
    } finally {
      setupPromise = null;
    }
  })();

  return setupPromise;
}

/**
 * Set the full playback queue and jump to the desired index.
 * The notification will show the active track with prev/next controls.
 * 
 * Important: All tracks must have valid url, title, and ideally artwork
 * for the notification to display correctly.
 */
export async function setFullQueue(tracks: RNTPTrack[], startIndex: number) {
  await setupTrackPlayer();
  if (tracks.length === 0) return;

  // Validate tracks have required metadata for notification display
  const validTracks = tracks.map((track) => ({
    ...track,
    // Ensure title and artist are always set (required for notification)
    title: track.title || 'Unknown Track',
    artist: track.artist || 'Unknown Artist',
  }));

  const existing = await TrackPlayer.getQueue();
  const sameQueue =
    existing.length === validTracks.length &&
    existing.every((item: any, i: number) => {
      const next = validTracks[i];
      const existingId = String(item?.id ?? '');
      const nextId = String(next?.id ?? '');
      return existingId === nextId && (item?.url ?? '') === (next?.url ?? '');
    });

  if (!sameQueue) {
    await TrackPlayer.reset();
    await TrackPlayer.add(validTracks);
    console.debug('[TrackPlayer] Queue updated with', validTracks.length, 'tracks');
  }

  if (startIndex >= 0 && startIndex < validTracks.length) {
    const activeIndex = await TrackPlayer.getActiveTrackIndex();
    if (activeIndex !== startIndex) {
      await TrackPlayer.skip(startIndex);
      console.debug('[TrackPlayer] Skipped to index', startIndex);
    }
  }
}

export async function play() {
  await setupTrackPlayer();
  await TrackPlayer.play();
}

export async function pause() {
  await setupTrackPlayer();
  await TrackPlayer.pause();
}

export async function stop() {
  await setupTrackPlayer();
  await TrackPlayer.stop();
}

export async function seekTo(seconds: number) {
  await setupTrackPlayer();
  await TrackPlayer.seekTo(seconds);
}

export async function skipToIndex(index: number) {
  await setupTrackPlayer();
  await TrackPlayer.skip(index);
}

export async function syncRepeatMode(mode: 'off' | 'one' | 'all') {
  await setupTrackPlayer();
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

export async function skipToNext() {
  await setupTrackPlayer();
  await TrackPlayer.skipToNext();
}

export async function skipToPrevious() {
  await setupTrackPlayer();
  await TrackPlayer.skipToPrevious();
}

export { State, Event };

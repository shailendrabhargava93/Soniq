/**
 * Web stub for react-native-track-player.
 * RNTP is native-only (Android/iOS). On web (Vercel), all methods are no-ops
 * and hooks return safe empty values so the rest of the app still compiles/runs.
 * Actual audio playback on web continues via expo-av (see audio.web.ts).
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export const Capability = {
    Play: 'play',
    Pause: 'pause',
    Stop: 'stop',
    SeekTo: 'seekTo',
    SkipToNext: 'skipToNext',
    SkipToPrevious: 'skipToPrevious',
  };
  
  export const Event = {
    PlaybackState: 'playback-state',
    PlaybackError: 'playback-error',
    PlaybackQueueEnded: 'playback-queue-ended',
    PlaybackActiveTrackChanged: 'playback-active-track-changed',
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
    RemoteNext: 'remote-next',
    RemotePrevious: 'remote-previous',
    RemoteSeek: 'remote-seek',
    RemoteDuck: 'remote-duck',
  };
  
  export const State = {
    None: 'none',
    Stopped: 'stopped',
    Paused: 'paused',
    Playing: 'playing',
    Buffering: 'buffering',
    Loading: 'loading',
    Ready: 'ready',
    Error: 'error',
  };
  
  export const RepeatMode = {
    Off: 0,
    Track: 1,
    Queue: 2,
  };
  
  // ─── Hooks ────────────────────────────────────────────────────────────────────
  
  export function useTrackPlayerEvents(_events, _handler) {
    // no-op on web
  }
  
  export function useProgress(_interval) {
    // Return static zeros — expo-av drives position/duration on web via PlayerContext
    return { position: 0, duration: 0, buffered: 0 };
  }
  
  export function useActiveTrack() {
    return null;
  }
  
  export function usePlaybackState() {
    return { state: State.None };
  }
  
  // ─── TrackPlayer default export (all no-ops) ──────────────────────────────────
  
  const TrackPlayer = {
    setupPlayer: async () => {},
    updateOptions: async () => {},
    registerPlaybackService: () => {},
    add: async () => {},
    reset: async () => {},
    play: async () => {},
    pause: async () => {},
    stop: async () => {},
    skip: async () => {},
    skipToNext: async () => {},
    skipToPrevious: async () => {},
    seekTo: async () => {},
    setRepeatMode: async () => {},
    getActiveTrackIndex: async () => null,
    getActiveTrack: async () => null,
    getQueue: async () => [],
    addEventListener: () => ({ remove: () => {} }),
  };
  
  export default TrackPlayer;
  
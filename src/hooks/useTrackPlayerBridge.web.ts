// Web: no-op stubs — RNTP is native-only, audio is handled by expo-av on web

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
  } as const;
  
  export const State = {
    None: 'none',
    Stopped: 'stopped',
    Paused: 'paused',
    Playing: 'playing',
    Buffering: 'buffering',
    Loading: 'loading',
    Ready: 'ready',
    Error: 'error',
  } as const;
  
  export function useTrackPlayerEvents(_events: any[], _handler: (event: any) => void) {
    // no-op on web — events are not needed, playback state is managed via expo-av
  }
  
import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * PlaybackService runs as a headless task on Android when the app is in
 * background or killed. It handles remote control events from the
 * notification panel and lock screen.
 */
export async function PlaybackService() {
  // RemotePlay: triggered when user taps play on lock screen / notification
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    try {
      await TrackPlayer.play();
      console.debug('[PlaybackService] RemotePlay executed');
    } catch (e) {
      console.warn('[PlaybackService] RemotePlay error:', e);
    }
  });

  // RemotePause: triggered when user taps pause on lock screen / notification
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    try {
      await TrackPlayer.pause();
      console.debug('[PlaybackService] RemotePause executed');
    } catch (e) {
      console.warn('[PlaybackService] RemotePause error:', e);
    }
  });

  // RemoteStop: triggered when user stops playback from lock screen
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    try {
      await TrackPlayer.stop();
      console.debug('[PlaybackService] RemoteStop executed');
    } catch (e) {
      console.warn('[PlaybackService] RemoteStop error:', e);
    }
  });

  // RemoteNext: triggered when user taps next on lock screen / notification
  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    try {
      await TrackPlayer.skipToNext();
      console.debug('[PlaybackService] RemoteNext executed');
    } catch (e) {
      console.warn('[PlaybackService] RemoteNext error (likely at end of queue):', e);
    }
  });

  // RemotePrevious: triggered when user taps previous on lock screen / notification
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    try {
      await TrackPlayer.skipToPrevious();
      console.debug('[PlaybackService] RemotePrevious executed');
    } catch (e) {
      console.warn('[PlaybackService] RemotePrevious error (likely at start of queue):', e);
    }
  });

  // RemoteSeek: triggered when user seeks in the notification
  TrackPlayer.addEventListener(Event.RemoteSeek, async ({ position }) => {
    try {
      await TrackPlayer.seekTo(position);
      console.debug('[PlaybackService] RemoteSeek to', position, 'executed');
    } catch (e) {
      console.warn('[PlaybackService] RemoteSeek error:', e);
    }
  });

  // RemoteDuck: triggered by audio focus loss (calls, notifications, etc.)
  TrackPlayer.addEventListener(Event.RemoteDuck, async ({ permanent, paused }) => {
    try {
      if (permanent) {
        await TrackPlayer.stop();
        console.debug('[PlaybackService] RemoteDuck permanent stop');
      } else if (paused) {
        await TrackPlayer.pause();
        console.debug('[PlaybackService] RemoteDuck pause');
      } else {
        await TrackPlayer.play();
        console.debug('[PlaybackService] RemoteDuck resume');
      }
    } catch (e) {
      console.warn('[PlaybackService] RemoteDuck error:', e);
    }
  });

  // Optional: Handle jump forward/backward if needed by some devices
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }) => {
    try {
      const position = await TrackPlayer.getProgress();
      await TrackPlayer.seekTo(position.position + (interval || 15));
      console.debug('[PlaybackService] RemoteJumpForward executed');
    } catch (e) {
      console.warn('[PlaybackService] RemoteJumpForward error:', e);
    }
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }) => {
    try {
      const position = await TrackPlayer.getProgress();
      await TrackPlayer.seekTo(Math.max(0, position.position - (interval || 15)));
      console.debug('[PlaybackService] RemoteJumpBackward executed');
    } catch (e) {
      console.warn('[PlaybackService] RemoteJumpBackward error:', e);
    }
  });
}

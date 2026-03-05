import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * PlaybackService runs as a headless task on Android when the app is in
 * background or killed. It handles remote control events from the
 * notification panel and lock screen.
 */
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext().catch(() => {
      // Already at end of queue
    });
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious().catch(() => {
      // Already at start of queue
    });
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => {
    TrackPlayer.seekTo(position);
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async ({ permanent, paused }) => {
    if (permanent) {
      await TrackPlayer.stop();
    } else if (paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });
}

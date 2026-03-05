// Native (Android/iOS): register the headless playback service with RNTP
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './playbackService';

export function registerTrackPlayer() {
  TrackPlayer.registerPlaybackService(() => PlaybackService);
}

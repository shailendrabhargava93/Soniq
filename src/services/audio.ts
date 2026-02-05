import { Audio } from 'expo-av';

type PlaybackStatus = any;

class AudioService {
  private sound: Audio.Sound | null = null;
  private status: PlaybackStatus = null;
  private statusCallback: ((status: PlaybackStatus) => void) | null = null;

  async load(uri: string) {
    if (this.sound) {
      await this.unload();
    }
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        shouldDuckAndroid: true,
      });
    } catch (e) {
      // ignore if platform doesn't support
    }

    const { sound, status } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false }
    );
    this.sound = sound;
    this.status = status;
    // attach previously set callback (if any)
    if (this.statusCallback && this.sound && typeof this.sound.setOnPlaybackStatusUpdate === 'function') {
      this.sound.setOnPlaybackStatusUpdate(this.statusCallback as any);
    }
    return status;
  }

  async play() {
    if (!this.sound) return;
    await this.sound.playAsync();
  }

  async pause() {
    if (!this.sound) return;
    await this.sound.pauseAsync();
  }

  async unload() {
    if (!this.sound) return;
    await this.sound.unloadAsync();
    this.sound = null;
    this.status = null;
  }

  async setPosition(ms: number) {
    if (!this.sound) return;
    if (typeof this.sound.setPositionAsync === 'function') {
      await this.sound.setPositionAsync(ms);
    }
  }

  getStatus() {
    return this.status;
  }

  // placeholder hooks for next/previous - app-level queue should implement these
  async replayNext() {
    // no-op; implement queue handling elsewhere
    return;
  }

  async replayPrevious() {
    // no-op; implement queue handling elsewhere
    return;
  }

  setStatusUpdate(callback: (status: PlaybackStatus) => void) {
    this.statusCallback = callback;
    if (this.sound && typeof this.sound.setOnPlaybackStatusUpdate === 'function') {
      this.sound.setOnPlaybackStatusUpdate(callback as any);
    }
  }
}

export const audioService = new AudioService();

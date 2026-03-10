import React, { useState } from "react";
import { View, TouchableOpacity, Image, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { Text } from "react-native-paper";
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { seekTo } from '../services/audio';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PlayerScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { currentSong, isPlaying, playSong, pauseSong, nextSong, previousSong, shuffle, toggleShuffle, repeatMode, setRepeatMode, toggleQueue, position, duration } = usePlayer();
  const { toggleSongFavorite, isSongFavorite } = useFavorites();
  const [pendingSeek, setPendingSeek] = useState<number | null>(null);
  const liked = currentSong?.id ? isSongFavorite(currentSong.id) : false;

  // Responsive sizing
  const isSmallScreen = width < 360;
  const isMediumScreen = width >= 360 && width < 768;
  const artworkSize = isSmallScreen ? width * 0.65 : isMediumScreen ? width * 0.7 : Math.min(width * 0.5, 400);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return 'repeat-one';
    return 'repeat';
  };

  const safeDuration = Math.max(Number(duration) || 0, 1);
  const effectivePosition = pendingSeek ?? (Number(position) || 0);
  const sliderValue = Math.min(Math.max(effectivePosition, 0), safeDuration);

  return (
    <View style={[styles.container, { backgroundColor: '#2C3E50', paddingTop: Math.max(insets.top + 8, 40) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialIcons name="keyboard-arrow-down" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOW PLAYING</Text>
      </View>

      {/* Album Artwork */}
      <View style={styles.artworkContainer}>
        <Image
          source={currentSong?.artwork ? { uri: currentSong.artwork } : require('../../assets/icon.png')}
          style={[styles.artwork, { width: artworkSize, height: artworkSize }]}
          resizeMode="cover"
        />
      </View>

      {/* Song Info */}
      <View style={[styles.songInfo, { width: artworkSize, alignSelf: 'center' }]}>
        <TouchableOpacity
          style={styles.favoriteIcon}
          onPress={() => {
            if (!currentSong?.id) return;
            toggleSongFavorite({
              id: currentSong.id,
              title: currentSong.title,
              artist: currentSong.artist,
              artwork: currentSong.artwork,
              uri: currentSong.uri,
            });
          }}
        >
          <MaterialIcons name={liked ? 'favorite' : 'favorite-border'} size={24} color={liked ? '#FF4081' : '#fff'} />
        </TouchableOpacity>
        <Text style={styles.songTitle} numberOfLines={1}>
          {currentSong?.title || 'No Song Playing'}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {currentSong?.artist || 'Unknown Artist'}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { width: artworkSize, alignSelf: 'center' }]}>
        <Slider
          value={sliderValue}
          onSlidingStart={() => setPendingSeek(sliderValue)}
          onValueChange={(val) => setPendingSeek(val)}
          onSlidingComplete={async (val) => {
            setPendingSeek(null);
            try {
              await seekTo(val);
            } catch (e) {
              console.warn('Seek failed', e);
            }
          }}
          minimumValue={0}
          maximumValue={safeDuration}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#4A5568"
          thumbTintColor="#1DB954"
          style={styles.slider}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(sliderValue)}</Text>
          <Text style={styles.timeText}>{formatTime(Number(duration) || 0)}</Text>
        </View>
      </View>

      {/* Playback Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleShuffle}>
          <MaterialIcons 
            name="shuffle" 
            size={28} 
            color={shuffle ? '#1DB954' : '#9CA3AF'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={previousSong}>
          <MaterialIcons name="skip-previous" size={40} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => isPlaying ? pauseSong() : playSong()}
        >
          <MaterialIcons 
            name={isPlaying ? 'pause' : 'play-arrow'} 
            size={40} 
            color="#fff" 
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={nextSong}>
          <MaterialIcons name="skip-next" size={40} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
          const currentIndex = modes.indexOf(repeatMode);
          setRepeatMode(modes[(currentIndex + 1) % modes.length]);
        }}>
          <MaterialIcons 
            name={getRepeatIcon()} 
            size={28} 
            color={repeatMode !== 'off' ? '#1DB954' : '#9CA3AF'} 
          />
        </TouchableOpacity>
      </View>

      {/* Up Next Button */}
      <TouchableOpacity style={styles.upNextButton} onPress={toggleQueue}>
        <MaterialIcons name="queue-music" size={20} color="#1DB954" />
        <Text style={styles.upNextText}>Up Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SCREEN_WIDTH < 360 ? 16 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH < 360 ? 20 : 30,
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#9CA3AF',
    fontSize: SCREEN_WIDTH < 360 ? 11 : 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH < 360 ? 20 : 30,
  },
  artwork: {
    borderRadius: 8,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH < 360 ? 16 : 20,
    position: 'relative',
  },
  favoriteIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  songTitle: {
    color: '#fff',
    fontSize: SCREEN_WIDTH < 360 ? 18 : 20,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  artistName: {
    color: '#9CA3AF',
    fontSize: SCREEN_WIDTH < 360 ? 13 : 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  progressContainer: {
    marginBottom: SCREEN_WIDTH < 360 ? 16 : 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH < 360 ? 30 : 40,
    paddingHorizontal: SCREEN_WIDTH < 360 ? 5 : 10,
  },
  playButton: {
    width: SCREEN_WIDTH < 360 ? 60 : 70,
    height: SCREEN_WIDTH < 360 ? 60 : 70,
    borderRadius: SCREEN_WIDTH < 360 ? 30 : 35,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  upNextText: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PlayerScreen;
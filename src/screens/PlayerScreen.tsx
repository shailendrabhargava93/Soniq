import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, IconButton, Card } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const PlayerScreen = () => {
  const { theme } = useTheme();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0.3);
  const [volume, setVolume] = useState(0.7);

  const currentSong = {
    id: '1',
    title: 'Beautiful Song',
    artist: 'Amazing Artist',
    album: 'Great Album',
    cover: 'https://picsum.photos/seed/nowplaying/300/300',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '3:45',
    currentTime: '1:23'
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {/* Album Art */}
          <Card style={{ width: 300, height: 300, marginBottom: 40 }}>
            <Card.Cover 
              source={{ uri: 'https://picsum.photos/seed/nowplaying/300/300' }} 
              style={{ width: 300, height: 300 }}
            />
          </Card>

          {/* Song Info */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, textAlign: 'center' }}>
              {currentSong.title}
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {currentSong.artist}
            </Text>
          </View>

          {/* Progress Slider */}
          <View style={{ width: '100%', marginBottom: 32 }}>
            <Slider
              value={position}
              onValueChange={setPosition}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.surfaceVariant}
              thumbTintColor={theme.colors.primary}
              style={{ width: '100%' }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {currentSong.currentTime}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {currentSong.duration}
              </Text>
            </View>
          </View>

          {/* Playback Controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40 }}>
            <IconButton
              icon="shuffle"
              size={24}
              onPress={() => {}}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <IconButton
              icon="skip-previous"
              size={32}
              onPress={() => {}}
              iconColor={theme.colors.onSurface}
            />
            <IconButton
              icon={isPlaying ? "pause-circle" : "play-circle"}
              size={64}
              onPress={() => setIsPlaying(!isPlaying)}
              iconColor={theme.colors.primary}
            />
            <IconButton
              icon="skip-next"
              size={32}
              onPress={() => {}}
              iconColor={theme.colors.onSurface}
            />
            <IconButton
              icon="repeat"
              size={24}
              onPress={() => {}}
              iconColor={theme.colors.onSurfaceVariant}
            />
          </View>

          {/* Volume Control */}
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24 }}>
            <MaterialIcons name="volume-down" size={24} color={theme.colors.onSurfaceVariant} />
            <Slider
              value={volume}
              onValueChange={setVolume}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.surfaceVariant}
              thumbTintColor={theme.colors.primary}
              style={{ flex: 1, marginHorizontal: 16 }}
            />
            <MaterialIcons name="volume-up" size={24} color={theme.colors.onSurfaceVariant} />
          </View>

          {/* Additional Controls */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
            <IconButton
              icon={isFavorite(currentSong.id) ? "favorite" : "favorite-border"}
              size={24}
              onPress={() => {
                if (isFavorite(currentSong.id)) {
                  removeFromFavorites(currentSong.id);
                } else {
                  addToFavorites(currentSong);
                }
              }}
              iconColor={isFavorite(currentSong.id) ? theme.colors.error : theme.colors.onSurfaceVariant}
            />
            <IconButton
              icon="queue-music"
              size={24}
              onPress={() => {}}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <IconButton
              icon="share"
              size={24}
              onPress={() => {}}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <IconButton
              icon="more-horiz"
              size={24}
              onPress={() => {}}
              iconColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PlayerScreen;
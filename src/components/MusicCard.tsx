import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

interface MusicCardProps {
  item: any;
  type: 'songs' | 'albums' | 'playlists' | 'artists';
  onPress: () => void;
}

export default function MusicCard({ item, type, onPress }: MusicCardProps) {
  const { theme } = useTheme();

  const getImageUrl = () => {
    if (type === 'songs') {
      return item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url;
    } else if (type === 'albums') {
      return item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url;
    } else if (type === 'playlists') {
      return item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url;
    } else if (type === 'artists') {
      return item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url;
    }
    return 'https://picsum.photos/seed/music/150/150';
  };

  const getTitle = () => {
    if (type === 'songs') {
      return item.title || item.name || 'Unknown Song';
    } else if (type === 'albums') {
      return item.title || item.name || 'Unknown Album';
    } else if (type === 'playlists') {
      return item.title || item.name || 'Unknown Playlist';
    } else if (type === 'artists') {
      return item.title || item.name || 'Unknown Artist';
    }
    return 'Unknown';
  };

  const getSubtitle = () => {
    if (type === 'songs') {
      return item.subtitle || item.artist || 'Unknown Artist';
    } else if (type === 'albums') {
      return item.subtitle || item.artist || 'Unknown Artist';
    } else if (type === 'playlists') {
      return item.subtitle || `${item.song_count || 0} songs`;
    } else if (type === 'artists') {
      return item.subtitle || `${item.followers_count || 0} followers`;
    }
    return '';
  };

  const cardWidth = type === 'artists' ? 120 : 150;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface }]}>
        <Card.Cover
          source={{ uri: getImageUrl() }}
          style={[styles.cover, { height: cardWidth }]}
          resizeMode="cover"
        />
        <Card.Content style={[styles.content, { backgroundColor: theme.colors.surface }]}>
          <Text 
            numberOfLines={2} 
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            {getTitle()}
          </Text>
          {getSubtitle() && (
            <Text 
              numberOfLines={1} 
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              {getSubtitle()}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cover: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    opacity: 0.8,
  },
});
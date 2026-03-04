import { StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

interface MusicCardProps {
  item: any;
  type: 'songs' | 'albums' | 'playlists' | 'artists';
  onPress: () => void;
}

export default function MusicCard({ item, type, onPress }: MusicCardProps) {
  const { theme } = useTheme();
  const ui = theme.ui;

  const getImageUrl = () => {
    if (typeof item.image === 'string') return item.image;
    return item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url || 'https://picsum.photos/seed/music/150/150';
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
      <Card
        style={[
          styles.card,
          {
            width: cardWidth,
            marginRight: ui.spacing.md,
            backgroundColor: theme.colors.surface,
            elevation: ui.shadow.card.elevation,
            shadowColor: ui.shadow.card.color,
            shadowOpacity: ui.shadow.card.opacity,
            shadowRadius: ui.shadow.card.radius,
          },
        ]}
      >
        <Card.Cover
          source={{ uri: getImageUrl() }}
          style={[
            styles.cover,
            {
              height: cardWidth,
              borderTopLeftRadius: ui.radius.md,
              borderTopRightRadius: ui.radius.md,
            },
          ]}
          resizeMode="cover"
        />
        <Card.Content
          style={[
            styles.content,
            {
              backgroundColor: theme.colors.surface,
              padding: ui.spacing.sm,
              borderBottomLeftRadius: ui.radius.md,
              borderBottomRightRadius: ui.radius.md,
            },
          ]}
        >
          <Text 
            numberOfLines={1} 
            style={[
              styles.title,
              {
                color: theme.colors.onSurface,
                fontWeight: ui.typography.miniTitle.fontWeight,
                marginBottom: ui.spacing.xxs,
              },
            ]}
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
    shadowOffset: { width: 0, height: 2 },
  },
  cover: {},
  content: {},
  title: {
  },
  subtitle: {
    opacity: 0.8,
  },
});

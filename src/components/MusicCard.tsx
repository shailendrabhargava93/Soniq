import { StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

interface MusicCardProps {
  item: any;
  type: 'songs' | 'albums' | 'playlists' | 'artists';
  onPress: () => void;
  noShadow?: boolean;
}

export default function MusicCard({ item, type, onPress, noShadow = false }: MusicCardProps) {
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
            borderRadius: noShadow ? 12 : ui.radius.md,
            overflow: 'hidden',
            borderWidth: 0,
            borderColor: 'transparent',
            elevation: noShadow ? 0 : ui.shadow.card.elevation,
            shadowColor: noShadow ? 'transparent' : ui.shadow.card.color,
            shadowOpacity: noShadow ? 0 : ui.shadow.card.opacity,
            shadowRadius: noShadow ? 0 : ui.shadow.card.radius,
            shadowOffset: noShadow ? { width: 0, height: 0 } : { width: 0, height: 2 },
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
              paddingHorizontal: noShadow ? 2 : ui.spacing.sm,
              paddingTop: noShadow ? 8 : ui.spacing.sm,
              paddingBottom: noShadow ? 2 : ui.spacing.sm,
              borderBottomLeftRadius: noShadow ? 12 : ui.radius.md,
              borderBottomRightRadius: noShadow ? 12 : ui.radius.md,
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

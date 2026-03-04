import React, { memo, useCallback, useMemo, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Portal, Dialog, Button } from "react-native-paper";
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { deleteMeta, getMeta } from '../services/storageCompat';
import { decodeHtmlEntities, getBestImage, getPlayableUrl } from '../utils/normalize';
import { saavnApi } from '../services/saavnApi';
import MediaRow from '../components/MediaRow';
import SkeletonTrack from '../components/SkeletonTrack';

const HEADER_HEIGHT = 60;
const STORAGE_KEY = 'recentlyPlayed';

interface RecentSong {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  image?: string;
  uri?: string;
  albumId?: string;
  album?: string;
}

export default function RecentlyPlayedScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const [recentSongs, setRecentSongs] = useState<RecentSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const headerHeight = HEADER_HEIGHT + insets.top;
  const topContentInset = headerHeight + 16;

  const loadRecentSongs = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await getMeta(STORAGE_KEY);
      if (Array.isArray(stored)) {
        setRecentSongs(stored);
      }
    } catch (e) {
      console.warn('Failed to load recently played songs', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    if (refreshing || loading) return;
    setRefreshing(true);
    try {
      const stored = await getMeta(STORAGE_KEY);
      if (Array.isArray(stored)) {
        setRecentSongs(stored);
      } else {
        setRecentSongs([]);
      }
    } catch (e) {
      console.warn('Failed to refresh recently played songs', e);
    } finally {
      setRefreshing(false);
    }
  }, [loading, refreshing]);

  useFocusEffect(
    useCallback(() => {
      loadRecentSongs();
    }, [loadRecentSongs]),
  );

  const handleClearAll = useCallback(() => {
    if (clearing) return;
    setClearDialogVisible(true);
  }, [clearing]);

  const confirmClearAll = useCallback(async () => {
    if (clearing) return;
    try {
      setClearing(true);
      setClearDialogVisible(false);
      await deleteMeta(STORAGE_KEY);
      setRecentSongs([]);
    } catch (e) {
      Alert.alert('Error', 'Failed to clear history');
    } finally {
      setClearing(false);
    }
  }, [clearing]);

  const handlePlaySong = useCallback(async (song: RecentSong) => {
    let resolved = { ...song };
    
    // If no URI, fetch it
    if (!resolved.uri) {
      try {
        const resp: any = await saavnApi.getSongById(song.id);
        const songObj = resp?.data?.[0] || resp?.data || resp;
        resolved.uri = getPlayableUrl(songObj) || '';
        resolved.artwork = getBestImage(songObj?.image) || resolved.artwork;
      } catch (e) {
        console.warn('Failed to resolve song for playback', e);
      }
    }

    if (!resolved.uri) {
      Alert.alert('Playback Error', 'Could not play this song');
      return;
    }

    const track = {
      id: resolved.id,
      title: resolved.title,
      artist: resolved.artist,
      uri: resolved.uri,
      artwork: resolved.artwork || resolved.image,
    };

    await player.playSong(track as any);
    player.open(track as any);
  }, [player]);

  const handleAddToQueue = useCallback((song: RecentSong) => {
    player.addToQueue({
      id: song.id,
      title: song.title,
      artist: song.artist,
      uri: song.uri || '',
      artwork: song.artwork || song.image,
    } as any);
  }, [player]);

  const handlePlayNext = useCallback((song: RecentSong) => {
    player.playNext({
      id: song.id,
      title: song.title,
      artist: song.artist,
      uri: song.uri || '',
      artwork: song.artwork || song.image,
    } as any);
  }, [player]);

  const handleGoToAlbum = useCallback((song: RecentSong) => {
    if (!song.albumId) return;
    (navigation as any).navigate('Album', {
      album: {
        id: song.albumId,
        albumId: song.albumId,
        title: song.album,
        name: song.album,
        image: song.artwork || song.image,
      }
    });
  }, [navigation]);

  const normalizedSongs = useMemo(
    () =>
      recentSongs.map((item) => ({
        ...item,
        title: decodeHtmlEntities(item.title),
        artist: decodeHtmlEntities(item.artist),
      })),
    [recentSongs],
  );

  const renderSongItem = useCallback(
    ({ item }: { item: RecentSong }) => (
      <RecentlyPlayedRow
        item={item}
        onPlaySong={handlePlaySong}
        onAddToQueue={handleAddToQueue}
        onPlayNext={handlePlayNext}
        onGoToAlbum={handleGoToAlbum}
      />
    ),
    [handleAddToQueue, handleGoToAlbum, handlePlayNext, handlePlaySong],
  );

  const renderSkeleton = useCallback(() => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonTrack key={i} />
      ))}
    </View>
  ), []);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={64} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
        No recently played songs
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
        Songs you play will appear here
      </Text>
    </View>
  ), [theme.colors.onSurfaceVariant]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.headerContent, { paddingTop: insets.top, height: headerHeight }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Recently Played</Text>
          {normalizedSongs.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearAll}
              disabled={clearing}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear recently played history"
              hitSlop={8}
            >
              <MaterialIcons name="delete-outline" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          ) : (
            <View style={styles.clearButtonPlaceholder} />
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ paddingTop: topContentInset }}>
          {renderSkeleton()}
        </View>
      ) : normalizedSongs.length === 0 ? (
        <View style={{ paddingTop: headerHeight }}>
          {renderEmptyState()}
        </View>
      ) : (
        <FlatList
          data={normalizedSongs}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderSongItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: topContentInset, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      <Portal>
        <Dialog
          visible={clearDialogVisible}
          onDismiss={() => setClearDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Clear History</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              Are you sure you want to clear all recently played songs?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmClearAll} textColor={theme.colors.error} disabled={clearing}>
              Clear
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
  },
});

type RecentlyPlayedRowProps = {
  item: RecentSong;
  onPlaySong: (song: RecentSong) => void;
  onAddToQueue: (song: RecentSong) => void;
  onPlayNext: (song: RecentSong) => void;
  onGoToAlbum: (song: RecentSong) => void;
};

const RecentlyPlayedRow = memo(function RecentlyPlayedRow({
  item,
  onPlaySong,
  onAddToQueue,
  onPlayNext,
  onGoToAlbum,
}: RecentlyPlayedRowProps) {
  const handlePress = useCallback(() => onPlaySong(item), [item, onPlaySong]);
  const handleAddToQueue = useCallback(() => onAddToQueue(item), [item, onAddToQueue]);
  const handlePlayNext = useCallback(() => onPlayNext(item), [item, onPlayNext]);
  const handleGoToAlbum = useCallback(() => onGoToAlbum(item), [item, onGoToAlbum]);

  return (
    <MediaRow
      item={{
        id: item.id,
        title: item.title,
        artist: item.artist,
        artwork: item.artwork || item.image,
        albumId: item.albumId,
        album: item.album,
        uri: item.uri,
      }}
      type="song"
      onPress={handlePress}
      onPlayNow={handlePress}
      onAddToQueue={handleAddToQueue}
      onPlayNext={handlePlayNext}
      onGoToAlbum={handleGoToAlbum}
    />
  );
});

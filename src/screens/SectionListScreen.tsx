import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Animated, NativeScrollEvent, NativeSyntheticEvent, Alert, Image } from 'react-native';
import { Text, Card } from "react-native-paper";
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import MediaRow from '../components/MediaRow';
import { saavnApi } from '../services/saavnApi';
import { getBestImage, getPlayableUrl } from '../utils/normalize';

const HEADER_HEIGHT = 60;
const SCROLL_THRESHOLD = 280;

interface SectionListScreenProps {}

const SectionListScreen: React.FC<SectionListScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const { type, title, data } = route.params as { type: string; title: string; data: any[] };
  const isTopSongsList = type === 'top_songs_india';
  
  const [showHeader, setShowHeader] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollY > SCROLL_THRESHOLD;
    if (shouldShow !== showHeader) {
      setShowHeader(shouldShow);
      Animated.timing(headerOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const buildTrack = async (item: any) => {
    let uri = item?.uri || getPlayableUrl(item?.saavnData || item) || '';
    const resolvedId = item?.saavnData?.id || item?.songId || item?.id;
    if (!uri && resolvedId) {
      try {
        const resp: any = await saavnApi.getSongById(String(resolvedId));
        const songObj = resp?.data?.[0] || resp?.data || resp;
        uri = getPlayableUrl(songObj) || '';
      } catch (e) {
        console.warn('[SectionList] Failed to resolve song URL', e);
      }
    }
    if (!uri) return null;
    return {
      id: String(resolvedId || item?.id || item?.title || 'song'),
      title: item?.title || item?.name || '',
      artist: item?.artist || item?.subtitle || item?.saavnData?.primaryArtists || '',
      uri,
      artwork: getBestImage(item?.image || item?.saavnData?.image),
    };
  };

  const handlePlayAll = async () => {
    if (!data || data.length === 0) return;
    if (isTopSongsList) {
      const track = await buildTrack(data[0]);
      if (!track) { Alert.alert('Playback error', 'No playable URL'); return; }
      const queue = (await Promise.all(data.map(buildTrack))).filter(Boolean) as any[];
      await player.playQueue(queue as any, 0);
      player.open(queue[0] as any);
      return;
    }
    const firstItem = data[0];
    if (firstItem.type === 'album' || type === 'album') {
      (navigation as any).navigate('Album', { album: firstItem });
    } else if (firstItem.type === 'playlist' || type === 'playlist') {
      (navigation as any).navigate('Playlist', { playlist: firstItem });
    }
  };

  const handleShuffle = async () => {
    if (!data || data.length === 0) return;
    if (isTopSongsList) {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const track = await buildTrack(shuffled[0]);
      if (!track) { Alert.alert('Playback error', 'No playable URL'); return; }
      const queue = (await Promise.all(shuffled.map(buildTrack))).filter(Boolean) as any[];
      await player.playQueue(queue as any, 0);
      player.open(queue[0] as any);
      return;
    }
    const randomIndex = Math.floor(Math.random() * data.length);
    const randomItem = data[randomIndex];
    if (randomItem.type === 'album' || type === 'album') {
      (navigation as any).navigate('Album', { album: randomItem });
    } else if (randomItem.type === 'playlist' || type === 'playlist') {
      (navigation as any).navigate('Playlist', { playlist: randomItem });
    }
  };

  const playSongItem = async (item: any) => {
    let uri = item?.uri || getPlayableUrl(item?.saavnData || item) || '';
    const resolvedId = item?.saavnData?.id || item?.songId || item?.id;

    if (!uri && resolvedId) {
      try {
        const resp: any = await saavnApi.getSongById(String(resolvedId));
        const songObj = (resp?.data?.[0]) || resp?.data || resp;
        uri = getPlayableUrl(songObj) || '';
      } catch (e) {
        console.warn('[SectionList] Failed to resolve song URL', e);
      }
    }

    if (!uri) {
      Alert.alert('Playback error', 'No playable URL');
      return;
    }

    const track = {
      id: String(resolvedId || item?.id || `${item?.title || item?.name || 'song'}`),
      title: item?.title || item?.name || '',
      artist: item?.artist || item?.subtitle || item?.saavnData?.primaryArtists || '',
      uri,
      artwork: getBestImage(item?.image || item?.saavnData?.image),
    };

    const queue = (await Promise.all(data.map(buildTrack))).filter(Boolean) as any[];
    const startIndex = Math.max(0, queue.findIndex((entry) => String(entry.id) === String(track.id)));
    if (queue.length === 0) {
      await player.playSong(track as any);
      player.open(track as any);
      return;
    }

    await player.playQueue(queue as any, startIndex);
    player.open(queue[startIndex] as any);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    isTopSongsList ? (
      <MediaRow
        item={{
          ...item,
          title: `${item?.position || index + 1}. ${item.title || item.name || ''}`,
          artist: item.artist || item.subtitle || '',
          artwork: item.image,
          image: item.image,
        }}
        type="song"
        onPress={() => playSongItem(item)}
        onPlayNow={(s) => playSongItem(s)}
        onAddToQueue={(s) => player.addToQueue(s)}
        onPlayNext={(s) => player.playNext(s)}
      />
    ) : (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          try {
            if (item.type === 'album' || type === 'album') {
              (navigation as any).navigate('Album', { album: item });
            } else if (item.type === 'playlist' || type === 'playlist') {
              (navigation as any).navigate('Playlist', { playlist: item });
            } else if (item.type === 'artist') {
              (navigation as any).navigate('Artist', { id: item.id, artist: item });
            }
          } catch (e) {
            console.warn('Navigation error', e);
          }
        }}
      >
        <Card style={styles.itemCard}>
          <Card.Cover
            source={item?.image ? { uri: item.image } : require('../../assets/icon.png')}
            style={styles.itemImage}
          />
          <Card.Content style={styles.itemContent}>
            <Text numberOfLines={2} style={[styles.itemTitle, { color: theme.colors.onSurface }]}>
              {item.title || item.name}
            </Text>
            <Text numberOfLines={1} style={[styles.itemSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {item.artist || item.subtitle || ''}
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    )
  );

  const coverImage = data && data[0]?.image ? data[0].image : null;
  const COVER_SIZE = 200;
  const collageTiles = isTopSongsList
    ? Array.from({ length: 4 }, (_, i) => {
        const img = data?.[i]?.image;
        const fallback = data?.[i % (data?.length || 1)]?.image;
        return img || fallback || null;
      }).filter(Boolean) as string[]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Floating back button - always visible */}
      <TouchableOpacity 
        style={[styles.floatingBackButton, { backgroundColor: theme.colors.surface, top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>

      {/* Animated Header - appears on scroll */}
      <Animated.View 
        style={[
          styles.headerWrapper, 
          { 
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top,
            opacity: headerOpacity,
            transform: [{
              translateY: headerOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-(HEADER_HEIGHT + insets.top), 0],
              })
            }]
          }
        ]}
        pointerEvents={showHeader ? 'auto' : 'none'}
      >
        <View style={styles.animatedHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <FlatList
        data={data || []}
        keyExtractor={(item, idx) => item.id?.toString() || `item-${idx}`}
        renderItem={renderItem}
        numColumns={isTopSongsList ? 1 : 2}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            <View style={{ height: 16 }} />
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Card style={[styles.coverCard, { backgroundColor: theme.colors.surface }]}>
                {isTopSongsList && collageTiles.length > 0 ? (
                  <View style={{ width: COVER_SIZE, height: COVER_SIZE, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 12, overflow: 'hidden' }}>
                    {Array.from({ length: 4 }, (_, idx) => (
                      <View key={idx} style={{ width: COVER_SIZE / 2, height: COVER_SIZE / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                        <Image
                          source={{ uri: collageTiles[idx] || collageTiles[idx % collageTiles.length] }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <Card.Cover
                    source={coverImage ? { uri: coverImage } : require('../../assets/icon.png')}
                    style={styles.coverImage}
                  />
                )}
              </Card>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                {title}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {data?.length || 0} {isTopSongsList ? 'songs' : 'items'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.iconButton, { borderColor: theme.colors.outline }]}
                onPress={handleShuffle}
              >
                <MaterialIcons name="shuffle" size={18} color={theme.colors.onSurface} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
                onPress={handlePlayAll}
              >
                <MaterialIcons name="play-arrow" size={18} color={theme.colors.onPrimary || '#fff'} />
                <Text style={[styles.playButtonText, { color: theme.colors.onPrimary || '#fff' }]}>
                  Play
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="music-off" size={64} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No items available
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  floatingBackButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 999,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
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
  animatedHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerBackButton: {
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
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  coverCard: {
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  coverImage: {
    width: 200,
    height: 200,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  playButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    flex: 1,
    margin: 4,
  },
  itemCard: {
    flex: 1,
  },
  itemImage: {
    height: 140,
  },
  itemContent: {
    paddingTop: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default SectionListScreen;

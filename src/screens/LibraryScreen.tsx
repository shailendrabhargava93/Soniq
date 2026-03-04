import React, { useCallback, useMemo, useState } from "react";
import { View, Alert, FlatList, ListRenderItem } from "react-native";
import { Text, Chip, ActivityIndicator } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePlayer } from '../contexts/PlayerContext';
import { saavnApi } from '../services/saavnApi';
import { getPlayableUrl } from '../utils/normalize';
import { cacheGet, cacheSet } from '../services/cache';
import MediaRow from '../components/MediaRow';
import Header from '../components/Header';
import { StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

type LibraryTab = 'songs' | 'playlists' | 'albums' | 'artists';

const TABS: Array<{ key: LibraryTab; label: string; icon: string }> = [
  { key: 'songs', label: 'Songs', icon: 'music-note' },
  { key: 'playlists', label: 'Playlists', icon: 'playlist-play' },
  { key: 'albums', label: 'Albums', icon: 'album' },
  { key: 'artists', label: 'Artists', icon: 'account-music' },
];

const LibraryScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const player = usePlayer();
  const { hydrated, songs: favouriteSongs, albums: favouriteAlbums, playlists: favouritePlaylists, artists: favouriteArtists } = useFavorites();
  const [activeTab, setActiveTab] = useState<LibraryTab>('songs');
  const loading = !hydrated;
  const HEADER_HEIGHT = 60;

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'songs':
        return favouriteSongs;
      case 'playlists':
        return favouritePlaylists;
      case 'albums':
        return favouriteAlbums;
      case 'artists':
        return favouriteArtists;
      default:
        return [];
    }
  }, [activeTab, favouriteSongs, favouritePlaylists, favouriteAlbums, favouriteArtists]);

  const emptyMessage = useMemo(() => {
    switch (activeTab) {
      case 'songs':
        return 'No favourite songs yet';
      case 'playlists':
        return 'No favourite playlists yet';
      case 'albums':
        return 'No favourite albums yet';
      case 'artists':
        return 'No favourite artists yet';
      default:
        return 'Nothing here yet';
    }
  }, [activeTab]);

  const listPerfConfig = useMemo(() => {
    const itemCount = currentData.length;

    if (itemCount <= 20) {
      return {
        initialNumToRender: 12,
        maxToRenderPerBatch: 12,
        updateCellsBatchingPeriod: 40,
        windowSize: 5,
      };
    }

    if (itemCount <= 100) {
      return {
        initialNumToRender: 10,
        maxToRenderPerBatch: 10,
        updateCellsBatchingPeriod: 50,
        windowSize: 7,
      };
    }

    return {
      initialNumToRender: 8,
      maxToRenderPerBatch: 8,
      updateCellsBatchingPeriod: 60,
      windowSize: 9,
    };
  }, [currentData.length]);

  const handlePlaySong = useCallback(async (song: any) => {
    if (!song?.id) return;
    const songId = String(song.id);
    let resolved = { ...song };
    if (!resolved.uri) {
      try {
        const cached = await cacheGet(`song:${songId}`, 1000 * 60 * 60 * 24);
        if (cached?.uri) {
          resolved = { ...cached, id: songId };
        }
      } catch {}
      if (!resolved.uri) {
        try {
          const resp: any = await saavnApi.getSongById(songId);
          const obj = resp?.data?.[0] || resp?.data || resp;
          resolved = {
            ...resolved,
            id: songId,
            title: obj?.title || obj?.name || resolved.title,
            artist: obj?.subtitle || obj?.artist || resolved.artist,
            artwork: obj?.image || obj?.cover || resolved.artwork,
            uri: getPlayableUrl(obj) || resolved.uri,
          };
          try { await cacheSet(`song:${songId}`, resolved); } catch {}
        } catch (error) {
          console.warn('Failed to resolve favourite song for playback', error);
        }
      }
    }

    if (!resolved.uri) {
      Alert.alert('Playback error', 'No playable URL');
      return;
    }

    const track = {
      id: songId,
      title: resolved.title || 'Unknown',
      artist: resolved.artist || '',
      uri: resolved.uri,
      artwork: resolved.artwork || resolved.image,
    };
    await player.playSong(track as any);
    player.open(track as any);
  }, [player]);

  const handleOpenPlaylist = useCallback((playlist: any) => {
    if (!playlist) return;
    const playlistId = playlist.id || playlist.playlistId || playlist.pid;
    if (!playlistId) return;
    navigation.navigate('Playlist', { playlist: { ...playlist, id: playlistId } });
  }, [navigation]);

  const handleOpenAlbum = useCallback((album: any) => {
    if (!album) return;
    const albumId = album.id || album.albumId || album.sid;
    if (!albumId) return;
    navigation.navigate('Album', { album: { ...album, id: albumId }, songs: album.songs });
  }, [navigation]);

  const handleOpenArtist = useCallback((artist: any) => {
    if (!artist) return;
    const artistId = artist.id || artist.artistId || artist.sid;
    if (!artistId) return;
    navigation.navigate('Artist', { id: artistId, artist: { id: artistId, name: artist.name, image: artist.image } });
  }, [navigation]);

  const handleGoToAlbum = useCallback((song: any) => {
    if (!song?.albumId) return;
    navigation.navigate('Album', {
      album: {
        id: song.albumId,
        albumId: song.albumId,
        title: song.album,
        name: song.album,
        image: song.artwork || song.image,
      },
    });
  }, [navigation]);

  const keyExtractor = useCallback((item: any, index: number) => {
    const id = item?.id ? String(item.id) : `${activeTab}-${index}`;
    return `${activeTab}-${id}`;
  }, [activeTab]);

  const renderContentItem: ListRenderItem<any> = useCallback(({ item }) => {
    if (activeTab === 'songs') {
      return (
        <MediaRow
          item={{
            ...item,
            id: item?.id,
            title: item?.title || 'Untitled',
            artist: item?.artist || '',
            artwork: item?.artwork || item?.image,
            uri: item?.uri || '',
          }}
          type="song"
          onPress={() => handlePlaySong(item)}
          onPlayNow={handlePlaySong}
          onAddToQueue={player.addToQueue}
          onPlayNext={player.playNext}
          onGoToAlbum={handleGoToAlbum}
        />
      );
    }

    if (activeTab === 'playlists') {
      const songCount = Array.isArray(item?.songs) ? item.songs.length : item?.songCount;
      return (
        <MediaRow
          item={{
            ...item,
            title: item?.title || item?.name || 'Playlist',
            subtitle: songCount ? `${songCount} songs` : undefined,
            image: item?.image,
          }}
          type="playlist"
          iconName="playlist-play"
          onPress={() => handleOpenPlaylist(item)}
        />
      );
    }

    if (activeTab === 'albums') {
      const songCount = Array.isArray(item?.songs) ? item.songs.length : undefined;
      return (
        <MediaRow
          item={{
            ...item,
            title: item?.title || item?.name || 'Album',
            subtitle: songCount ? `${songCount} songs` : undefined,
            image: item?.image,
          }}
          type="album"
          iconName="album"
          onPress={() => handleOpenAlbum(item)}
        />
      );
    }

    return (
      <MediaRow
        item={{
          ...item,
          name: item?.name || item?.title || 'Artist',
          image: item?.image,
        }}
        type="artist"
        iconName="person"
        shape="round"
        showContextMenu={false}
        onPress={() => handleOpenArtist(item)}
      />
    );
  }, [activeTab, handleGoToAlbum, handleOpenAlbum, handleOpenArtist, handleOpenPlaylist, handlePlaySong, player.addToQueue, player.playNext]);

  const renderTab: ListRenderItem<{ key: LibraryTab; label: string; icon: string }> = useCallback(({ item: tab }) => (
    <Chip
      selected={activeTab === tab.key}
      onPress={() => setActiveTab(tab.key)}
      mode={activeTab === tab.key ? 'flat' : 'outlined'}
      style={[
        styles.tabChip,
        {
          backgroundColor: activeTab === tab.key ? theme.colors.primaryContainer : theme.colors.surface,
          borderColor: activeTab === tab.key ? theme.colors.primary : theme.colors.outlineVariant,
        },
      ]}
      textStyle={[
        styles.tabChipText,
        {
          color: activeTab === tab.key ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
          fontWeight: activeTab === tab.key ? '700' : '500',
        },
      ]}
      showSelectedOverlay
      icon={() =>
        tab.key === 'artists' ? (
          <MaterialCommunityIcons
            name={tab.icon as any}
            size={18}
            color={activeTab === tab.key ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        ) : (
          <MaterialIcons
            name={tab.icon as any}
            size={18}
            color={activeTab === tab.key ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        )
      }
    >
      {tab.label}
    </Chip>
  ), [activeTab, theme.colors.onPrimaryContainer, theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.outlineVariant, theme.colors.primary, theme.colors.primaryContainer, theme.colors.surface]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
        <Header title="Your Library" hideThemeToggle />
      </View>

      <View style={[styles.tabsWrapper, { paddingTop: HEADER_HEIGHT + 16, backgroundColor: theme.colors.background }]}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(tab) => tab.key}
          renderItem={renderTab}
          contentContainerStyle={styles.tabsContent}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.listWrapper}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={currentData}
            extraData={activeTab}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            renderItem={renderContentItem}
            removeClippedSubviews
            initialNumToRender={listPerfConfig.initialNumToRender}
            maxToRenderPerBatch={listPerfConfig.maxToRenderPerBatch}
            updateCellsBatchingPeriod={listPerfConfig.updateCellsBatchingPeriod}
            windowSize={listPerfConfig.windowSize}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{emptyMessage}</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabsWrapper: {
    paddingHorizontal: 16,
    zIndex: 10,
  },
  tabsContent: {
    paddingBottom: 16,
  },
  tabChip: {
    marginRight: 8,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 13,
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  centered: {
    padding: 24,
    alignItems: 'center',
  },
});

export default LibraryScreen;

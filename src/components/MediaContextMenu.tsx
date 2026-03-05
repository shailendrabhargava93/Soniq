import React, { useState } from 'react';
import { View, Share, TouchableWithoutFeedback, StyleSheet, Modal, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Text, Button, Drawer, Portal, Dialog, IconButton, Divider } from 'react-native-paper';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../contexts/PlayerContext';
import { saavnApi } from '../services/saavnApi';
import { getBestImage, decodeHtmlEntities, getPlayableUrl } from '../utils/normalize';
import { cacheGet, cacheSet } from '../services/cache';

type MediaType = 'song' | 'album' | 'playlist' | 'artist';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  item: any;
  type: MediaType;
  onPlayNow?: (item: any) => void;
  onPlayAll?: (item: any) => void;
  onShuffle?: (item: any) => void;
  onAddToQueue?: (item: any) => void;
  onPlayNext?: (item: any) => void;
  onGoToAlbum?: (item: any) => void;
  showFavoriteToggle?: boolean;
  onNavigate?: (item: any) => void;
};

export default function MediaContextMenu({
  visible,
  onDismiss,
  item,
  type,
  onPlayNow,
  onPlayAll,
  onShuffle,
  onAddToQueue,
  onPlayNext,
  onGoToAlbum,
  showFavoriteToggle = true,
  onNavigate,
}: Props) {
  const {
    toggleSongFavorite,
    isSongFavorite,
    toggleAlbumFavorite,
    isAlbumFavorite,
    togglePlaylistFavorite,
    isPlaylistFavorite,
    toggleArtistFavorite,
    isArtistFavorite,
  } = useFavorites();
  const nav = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const [isLoading, setIsLoading] = useState(false);
  const [artistInfoVisible, setArtistInfoVisible] = useState(false);
  const [artistDetails, setArtistDetails] = useState<any>(null);
  const [artistNavTarget, setArtistNavTarget] = useState<any>(null);

  if ((!visible && !artistInfoVisible) || !item) return null;

  const title = item.title || item.name;
  const subtitle = item.subtitle || item.artist;

  const extractArtistLabel = (source: any): string => {
    if (!source) return '';
    if (typeof source === 'string') return decodeHtmlEntities(source);
    if (Array.isArray(source)) {
      const names = source
        .map((entry: any) => {
          if (!entry) return '';
          if (typeof entry === 'string') return decodeHtmlEntities(entry);
          if (typeof entry === 'object') {
            if (entry.name) return decodeHtmlEntities(entry.name);
            if (entry.title) return decodeHtmlEntities(entry.title);
            if (entry.text) return decodeHtmlEntities(entry.text);
          }
          return '';
        })
        .filter(Boolean);
      return names.join(', ');
    }
    if (typeof source === 'object') {
      if (Array.isArray(source.primaryArtists)) return extractArtistLabel(source.primaryArtists);
      if (Array.isArray(source.primary)) return extractArtistLabel(source.primary);
      if (Array.isArray(source.artists)) return extractArtistLabel(source.artists);
      if (Array.isArray(source.all)) return extractArtistLabel(source.all);
      if (source.name) return decodeHtmlEntities(source.name);
      if (source.title) return decodeHtmlEntities(source.title);
    }
    return '';
  };

  const fetchSongs = async () => {
    const itemId = item.id || item.albumId || item.playlistId || item.artistId;
    if (!itemId) {
      Alert.alert('Error', 'Invalid item ID');
      return [];
    }

    try {
      setIsLoading(true);
      const cacheKey = `${type}:${itemId}`;
      const cached = await cacheGet(cacheKey, 1000 * 60 * 60 * 24);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }

      let resp: any;
      if (type === 'album') {
        resp = await saavnApi.getAlbumById(String(itemId));
      } else if (type === 'playlist') {
        resp = await saavnApi.getPlaylistById(String(itemId));
      } else if (type === 'artist') {
        resp = await saavnApi.getArtistById(String(itemId));
      }

      const data = resp?.data || resp;
      let songsArr: any[] = [];

      if (type === 'artist') {
        songsArr = Array.isArray(data?.data?.topSongs)
          ? data.data.topSongs
          : Array.isArray(data?.topSongs)
            ? data.topSongs
            : [];
      } else {
        songsArr = Array.isArray(data?.data?.songs)
          ? data.data.songs
          : Array.isArray(data?.songs)
            ? data.songs
            : Array.isArray(data)
              ? data
              : [];
      }

      const mapped = songsArr.map((s: any) => {
        const artistLabel = extractArtistLabel(s.primaryArtists || s.artists || s.singers || s.subtitle || s.artist) || 'Unknown Artist';
        const artwork = getBestImage(s.image || s.images || item.image);
        return {
          id: s.id || s.sid || s.songid,
          title: decodeHtmlEntities(s.title || s.name || ''),
          artist: artistLabel,
          artwork,
          image: artwork,
          uri: getPlayableUrl(s) || '',
          albumId: s.albumid || s.albumId || s.album?.id,
          album: decodeHtmlEntities(s.album?.name || s.album?.title || s.albumName || s.album || ''),
        };
      });

      try { await cacheSet(cacheKey, mapped); } catch {}
      return mapped;
    } catch (e) {
      console.error('Failed to fetch songs', e);
      Alert.alert('Error', 'Failed to load songs');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAll = async () => {
    if (type === 'song') {
      onPlayNow?.(item);
      onDismiss();
      return;
    }

    if (onPlayAll) {
      onPlayAll(item);
      onDismiss();
      return;
    }

    const songs = await fetchSongs();
    if (songs.length === 0) {
      onDismiss();
      return;
    }

    const firstSong = songs[0];
    if (!firstSong.uri) {
      try {
        const resp: any = await saavnApi.getSongById(firstSong.id);
        const songObj = resp?.data?.[0] || resp?.data || resp;
        firstSong.uri = getPlayableUrl(songObj) || firstSong.uri;
      } catch (e) {
        console.warn('Failed to resolve first song', e);
      }
    }

    if (!firstSong.uri) {
      Alert.alert('Playback error', 'No playable URL');
      onDismiss();
      return;
    }

    await player.playSong(firstSong);
    player.open(firstSong);
    onDismiss();
  };

  const handleShuffle = async () => {
    if (type === 'song') {
      onPlayNext?.(item);
      onDismiss();
      return;
    }

    if (onShuffle) {
      onShuffle(item);
      onDismiss();
      return;
    }

    const songs = await fetchSongs();
    if (songs.length === 0) {
      onDismiss();
      return;
    }

    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    const firstSong = shuffled[0];

    if (!firstSong.uri) {
      try {
        const resp: any = await saavnApi.getSongById(firstSong.id);
        const songObj = resp?.data?.[0] || resp?.data || resp;
        firstSong.uri = getPlayableUrl(songObj) || firstSong.uri;
      } catch (e) {
        console.warn('Failed to resolve first song', e);
      }
    }

    if (!firstSong.uri) {
      Alert.alert('Playback error', 'No playable URL');
      onDismiss();
      return;
    }

    await player.playSong(firstSong);
    player.open(firstSong);
    for (let i = 1; i < shuffled.length; i++) {
      player.addToQueue(shuffled[i]);
    }
    onDismiss();
  };

  const handleAddToQueue = async () => {
    if (type === 'song') {
      onAddToQueue?.(item);
      onDismiss();
      return;
    }

    if (onAddToQueue) {
      onAddToQueue(item);
      onDismiss();
      return;
    }

    const songs = await fetchSongs();
    if (songs.length === 0) {
      onDismiss();
      return;
    }

    songs.forEach((song: any) => {
      player.addToQueue(song);
    });

    Alert.alert('Added to Queue', `${songs.length} song${songs.length !== 1 ? 's' : ''} added to queue`);
    onDismiss();
  };

  const handleShare = async () => {
    try {
      let shareUri = item.uri;
      if (type === 'song' && !shareUri) {
        setIsLoading(true);
        try {
          const resp: any = await saavnApi.getSongById(item.id);
          const songObj = resp?.data?.[0] || resp?.data || resp;
          shareUri = getPlayableUrl(songObj) || shareUri;
        } catch (e) {
          console.warn('Failed to fetch song details for share', e);
        } finally {
          setIsLoading(false);
        }
      }

      const message = type === 'song'
        ? `${title || 'Song'} - ${item.artist || ''}\n${shareUri || ''}`
        : type === 'artist'
          ? `Check out ${title}!`
          : `${title}${subtitle ? ` - ${subtitle}` : ''}`;
      await Share.share({ message });
    } catch (e) {
      // swallow
    }
    onDismiss();
  };

  const toggleFav = () => {
    if (!item?.id) return;

    if (type === 'song') {
      toggleSongFavorite({
        id: item.id,
        title: item.title,
        artist: item.artist,
        artwork: item.artwork || item.image,
        album: item.album,
        albumId: item.albumId,
        uri: item.uri,
      });
      onDismiss();
      return;
    }

    const favData = {
      id: item.id,
      title: item.title || item.name,
      name: item.name || item.title,
      subtitle: item.subtitle,
      image: item.image,
      songs: item.songs,
    };

    switch (type) {
      case 'album':
        toggleAlbumFavorite({ ...favData, albumId: item.id });
        break;
      case 'playlist':
        togglePlaylistFavorite({ ...favData, playlistId: item.id });
        break;
      case 'artist':
        toggleArtistFavorite({ ...favData, artistId: item.id });
        break;
    }
    onDismiss();
  };

  const isFavorite = () => {
    if (!item?.id) return false;
    switch (type) {
      case 'song':
        return isSongFavorite(item.id);
      case 'album':
        return isAlbumFavorite(item.id);
      case 'playlist':
        return isPlaylistFavorite(item.id);
      case 'artist':
        return isArtistFavorite(item.id);
      default:
        return false;
    }
  };

  const getTypeLabel = () => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleGoToAlbum = () => {
    if (onGoToAlbum) {
      onGoToAlbum(item);
      onDismiss();
      return;
    }

    const albumId = item.albumId || item.album?.id;
    if (!albumId) {
      Alert.alert('Error', 'Album not available');
      return;
    }

    try {
      (nav as any).navigate('Album', {
        album: {
          id: albumId,
          albumId,
          title: item.album || item.title || 'Album',
          name: item.album || item.title || 'Album',
          image: item.albumArtwork || item.artwork || item.image,
        },
      });
      onDismiss();
    } catch (e) {
      Alert.alert('Error', 'Unable to open album');
    }
  };

  const handleViewArtistInfo = async (artistSource?: { id?: string | number; name?: string; image?: string | null }) => {
    const fallbackId =
      artistSource?.id ||
      item.artistId ||
      item.primaryArtistId ||
      (type === 'artist' ? item.id || item.artistId : undefined);
    const fallbackName =
      artistSource?.name ||
      item.artist ||
      item.name ||
      item.title;
    const fallbackImage = artistSource?.image || item.image || item.artwork;

    try {
      if (visible) onDismiss();
      setIsLoading(true);
      let resolvedId: any = fallbackId;
      let resolvedName: any = fallbackName;
      let resolvedImage: any = fallbackImage;
      let data: any = null;

      if (!resolvedId && resolvedName) {
        try {
          const searchResp: any = await (saavnApi as any).search(String(resolvedName));
          const searchData = searchResp?.data || searchResp;
          const firstArtist = searchData?.artists?.results?.[0];
          if (firstArtist) {
            resolvedId = firstArtist.id;
            resolvedName = firstArtist.name || resolvedName;
            resolvedImage = getBestImage(firstArtist.image || resolvedImage);
          }
        } catch (e) {
          // continue with fallback values
        }
      }

      if (resolvedId) {
        const resp: any = await saavnApi.getArtistById(String(resolvedId));
        data = resp?.data || resp;
        resolvedId = data?.id || resolvedId;
        resolvedName = data?.name || resolvedName;
        resolvedImage = getBestImage(data?.image || resolvedImage);
      }

      setArtistDetails({
        name: data?.name || resolvedName || item.name || item.title,
        image: getBestImage(data?.image || resolvedImage || item.image),
        bio: data?.bio || data?.description,
        followers: data?.followerCount || data?.followers || data?.fans,
        isVerified: data?.isVerified,
        language: data?.dominantLanguage || data?.language,
      });
      setArtistNavTarget({
        id: resolvedId,
        artist: {
          id: resolvedId,
          name: data?.name || resolvedName || item.artist || item.name || item.title,
          image: getBestImage(data?.image || resolvedImage || item.image),
        },
      });
      setArtistInfoVisible(true);
    } catch (e) {
      console.error('Failed to load artist details', e);
      Alert.alert('Error', 'Failed to load artist details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
        <View style={styles.modalRoot}>
          <TouchableWithoutFeedback onPress={onDismiss}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={[styles.drawerContainer, { backgroundColor: theme.colors.surface }]}>
            {isLoading ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                  {type === 'song' ? 'Loading info...' : 'Loading songs...'}
                </Text>
              </View>
            ) : null}
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <View style={styles.headerTextWrap}>
                  <Text style={[styles.itemTitle, { color: theme.colors.onSurface }]}>{title}</Text>
                  {subtitle ? (
                    <Text style={[styles.itemSubtitle, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>
                  ) : null}
                </View>
                <IconButton
                  icon={({ size, color }) => <MaterialIcons name="close" size={size} color={color} />}
                  onPress={onDismiss}
                />
              </View>
              <Divider />
              <Drawer.Section>
                <Drawer.Item
                  icon={({ size, color }) => <MaterialIcons name="play-arrow" size={size} color={color} />}
                  label={type === 'song' ? 'Play Now' : 'Play All'}
                  onPress={handlePlayAll}
                  disabled={isLoading}
                />
                <Drawer.Item
                  icon={({ size, color }) => <MaterialIcons name={type === 'song' ? 'skip-next' : 'shuffle'} size={size} color={color} />}
                  label={type === 'song' ? 'Play Next' : 'Shuffle'}
                  onPress={handleShuffle}
                  disabled={isLoading}
                />
                <Drawer.Item
                  icon={({ size, color }) => <MaterialIcons name="queue-music" size={size} color={color} />}
                  label="Add to Queue"
                  onPress={handleAddToQueue}
                  disabled={isLoading}
                />
                {showFavoriteToggle ? (
                  <Drawer.Item
                    icon={({ size, color }) => <MaterialIcons name={isFavorite() ? 'favorite' : 'favorite-border'} size={size} color={color} />}
                    label={isFavorite() ? 'Remove from favourites' : 'Add to favourites'}
                    onPress={toggleFav}
                    disabled={isLoading}
                  />
                ) : null}
                {type === 'song' ? (
                  <>
                    <Drawer.Item
                      icon={({ size, color }) => <MaterialIcons name="album" size={size} color={color} />}
                      label="Go to Album"
                      onPress={handleGoToAlbum}
                    />
                    <Drawer.Item
                      icon={({ size, color }) => <MaterialIcons name="share" size={size} color={color} />}
                      label="Share"
                      onPress={handleShare}
                      disabled={isLoading}
                    />
                    <Drawer.Item
                      icon={({ size, color }) => <MaterialIcons name="person" size={size} color={color} />}
                      label="View artist"
                      onPress={() => handleViewArtistInfo({ id: item.artistId || item.primaryArtistId, name: item.artist, image: item.image || item.artwork })}
                    />
                  </>
                ) : (
                  <>
                    <Drawer.Item
                      icon={({ size, color }) => <MaterialIcons name="open-in-new" size={size} color={color} />}
                      label={type === 'artist' ? 'View Artist Info' : `Open ${getTypeLabel()}`}
                      onPress={() => {
                        if (type === 'artist') {
                          handleViewArtistInfo({ id: item.id || item.artistId, name: item.name || item.title, image: item.image });
                        } else {
                          onNavigate?.(item);
                          onDismiss();
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Drawer.Item
                      icon={({ size, color }) => <MaterialIcons name="share" size={size} color={color} />}
                      label="Share"
                      onPress={handleShare}
                      disabled={isLoading}
                    />
                  </>
                )}
              </Drawer.Section>
            </ScrollView>
            <View style={{ paddingBottom: Math.max(8, insets.bottom) }} />
          </View>
        </View>
      </Modal>

      <Portal>
        <Dialog
          visible={artistInfoVisible}
          onDismiss={() => setArtistInfoVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Artist Info</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ maxHeight: 400 }}>
              {artistDetails?.image ? (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Image source={{ uri: artistDetails.image }} style={{ width: 120, height: 120, borderRadius: 60 }} />
                </View>
              ) : null}
              <Text style={[styles.dialogName, { color: theme.colors.onSurface }]}>
                {artistDetails?.name}
                {artistDetails?.isVerified ? (
                  <MaterialIcons name="verified" size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                ) : null}
              </Text>
              {artistDetails?.followers ? (
                <Text style={[styles.dialogInfo, { color: theme.colors.onSurfaceVariant }]}>
                  <MaterialIcons name="people" size={14} /> {artistDetails.followers.toLocaleString()} Followers
                </Text>
              ) : null}
              {artistDetails?.language ? (
                <Text style={[styles.dialogInfo, { color: theme.colors.onSurfaceVariant }]}>
                  <MaterialIcons name="language" size={14} /> {artistDetails.language}
                </Text>
              ) : null}
              {artistDetails?.bio ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.dialogBio, { color: theme.colors.onSurfaceVariant }]}>
                    {artistDetails.bio}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => {
              setArtistInfoVisible(false);
              if (artistNavTarget?.id) {
                try {
                  (nav as any).navigate('Artist', artistNavTarget);
                } catch (e) {
                  // swallow
                }
              } else {
                onNavigate?.(item);
              }
              onDismiss();
            }}>View Full Profile</Button>
            <Button onPress={() => setArtistInfoVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  drawerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  headerRow: {
    paddingLeft: 16,
    paddingTop: 16,
    paddingBottom: 8,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  dialogName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  dialogBioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dialogBio: {
    fontSize: 14,
    lineHeight: 20,
  },
});

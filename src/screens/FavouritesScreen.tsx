import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, StyleSheet, ScrollView } from "react-native";
import { Text, Button, IconButton, Chip } from "react-native-paper";
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import SkeletonTrack from '../components/SkeletonTrack';
import MediaRow from '../components/MediaRow';
import { saavnApi } from '../services/saavnApi';
import { cacheGet, cacheSet } from '../services/cache';
import { getPlayableUrl, getBestImage } from '../utils/normalize';

export default function FavouritesScreen() {
  const { theme } = useTheme();
  const player = usePlayer();
  const navigation = useNavigation();
  const { hydrated, songs: favouriteSongs, albums: favouriteAlbums, playlists: favouritePlaylists, artists: favouriteArtists, removeSongFavorite, removeAlbumFavorite, removePlaylistFavorite, removeArtistFavorite } = useFavorites();
  const [tab, setTab] = useState<'songs' | 'albums' | 'playlists' | 'artists'>('songs');
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const HEADER_HEIGHT = 60;

  useEffect(() => {
    if (!hydrated) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const normalizedSongs = await Promise.all((favouriteSongs || []).map(async (it: any) => {
          if (!it) return null;
          const id = it.id || it.songId || it.sid;
          if (!id) return it;
          try {
            const cached = await cacheGet(`song:${id}`, 1000 * 60 * 60 * 24);
            if (cached) return cached;
          } catch {}
          if (it.title && it.uri) return it;
          try {
            const resp: any = await saavnApi.getSongById(id);
            const obj = (resp?.data?.[0]) || resp?.data || resp;
            const mapped = {
              id: obj.id || id,
              title: obj.title || obj.name || it.title || 'Unknown',
              artist: obj.subtitle || obj.artist || it.artist || '',
              uri: getPlayableUrl(obj) || it.uri || '',
              artwork: obj.image || obj.cover || it.artwork || it.image,
            };
            try { await cacheSet(`song:${id}`, mapped); } catch {}
            return mapped;
          } catch (e) {
            return it;
          }
        }));

        const normalizedAlbums = await Promise.all((favouriteAlbums || []).map(async (it: any) => {
          if (!it) return null;
          const id = it.id || it.albumId || it.sid;
          if (!id) return it;
          try {
            const cached = await cacheGet(`album:${id}`, 1000 * 60 * 60 * 24);
            if (cached) return cached;
          } catch {}
          if (it.title && it.image) return it;
          try {
            const resp: any = await saavnApi.getAlbumById(id);
            const data = resp?.data || resp;
            const songsArr = Array.isArray(data?.data?.songs) ? data.data.songs : Array.isArray(data?.songs) ? data.songs : [];
            const mapped = { id, title: data?.data?.name || data?.name || it.title || 'Album', image: data?.data?.image || data?.image || it.image, songs: songsArr };
            try { await cacheSet(`album:${id}`, mapped); } catch {}
            return mapped;
          } catch (e) {
            return it;
          }
        }));

        const normalizedPlaylists = await Promise.all((favouritePlaylists || []).map(async (it: any) => {
          if (!it) return null;
          const id = it.id || it.playlistId || it.pid || it.sid;
          if (!id) return it;
          try {
            const cached = await cacheGet(`playlist:${id}`, 1000 * 60 * 60 * 24);
            if (cached) return cached;
          } catch {}
          if (it.title && it.image) return it;
          try {
            const resp: any = await saavnApi.getPlaylistById(id);
            const data = resp?.data || resp;
            const songsArr = Array.isArray(data?.data?.songs) ? data.data.songs : Array.isArray(data?.songs) ? data.songs : [];
            const mapped = { id, title: data?.data?.title || data?.title || it.title || 'Playlist', image: getBestImage(data?.data?.image || data?.image || it.image), songs: songsArr };
            try { await cacheSet(`playlist:${id}`, mapped); } catch {}
            return mapped;
          } catch (e) {
            return it;
          }
        }));

        const normalizedArtists = (favouriteArtists || []).filter(Boolean);

        if (!mounted) return;
        setSongs(normalizedSongs.filter(Boolean));
        setAlbums(normalizedAlbums.filter(Boolean));
        setPlaylists(normalizedPlaylists.filter(Boolean));
        setArtists(normalizedArtists);
      } catch (e: any) {
        console.warn('failed to load favourites', e);
        if (mounted) setError('Failed to load favourites');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [hydrated, favouriteSongs, favouriteAlbums, favouritePlaylists, favouriteArtists]);

  const removeSong = async (songId: string | number) => {
    const id = String(songId);
    setSongs((prev) => prev.filter((song) => String(song?.id) !== id));
    await removeSongFavorite(id);
  };

  const removeAlbum = async (albumId: string | number) => {
    const id = String(albumId);
    setAlbums((prev) => prev.filter((album) => String(album?.id) !== id));
    await removeAlbumFavorite(id);
  };

  const removePlaylist = async (playlistId: string | number) => {
    const id = String(playlistId);
    setPlaylists((prev) => prev.filter((playlist) => String(playlist?.id) !== id));
    await removePlaylistFavorite(id);
  };

  const removeArtist = async (artistId: string | number) => {
    const id = String(artistId);
    setArtists((prev) => prev.filter((artist) => String(artist?.id) !== id));
    await removeArtistFavorite(id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
        <Header title="Library" hideThemeToggle />
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: HEADER_HEIGHT + 16, backgroundColor: theme.colors.surface }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <Chip 
            mode={tab === 'songs' ? 'flat' : 'outlined'} 
            selected={tab === 'songs'}
            onPress={() => setTab('songs')}
            style={{ marginRight: 8 }}
            showSelectedOverlay
          >
            Songs
          </Chip>
          <Chip 
            mode={tab === 'albums' ? 'flat' : 'outlined'} 
            selected={tab === 'albums'}
            onPress={() => setTab('albums')}
            style={{ marginRight: 8 }}
            showSelectedOverlay
          >
            Albums
          </Chip>
          <Chip 
            mode={tab === 'playlists' ? 'flat' : 'outlined'} 
            selected={tab === 'playlists'}
            onPress={() => setTab('playlists')}
            style={{ marginRight: 8 }}
            showSelectedOverlay
          >
            Playlists
          </Chip>
          <Chip 
            mode={tab === 'artists' ? 'flat' : 'outlined'} 
            selected={tab === 'artists'}
            onPress={() => setTab('artists')}
            style={{ marginRight: 8 }}
            showSelectedOverlay
          >
            Artists
          </Chip>
        </ScrollView>
      </View>

      {error ? (
        <View style={{ padding: 16 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.error }}>{error}</Text>
          <Button mode="outlined" onPress={() => { /* reload */ }}>Retry</Button>
        </View>
      ) : null}

      {tab === 'songs' ? (
        loading ? (
          <View style={{ padding: 12 }}>
            <SkeletonTrack />
            <SkeletonTrack />
            <SkeletonTrack />
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(i, idx) => (i?.id ? String(i.id) : String(idx))}
            renderItem={({ item, index }) => (
              <View style={{ position: 'relative' }}>
                <MediaRow
                  item={item}
                  type="song"
                  onPress={async () => {
                    if (!item.uri) {
                      try {
                        const resp: any = await saavnApi.getSongById(item.id);
                        const obj = (resp?.data?.[0]) || resp?.data || resp;
                        item.uri = getPlayableUrl(obj) || item.uri;
                      } catch (e) { console.warn(e); }
                    }
                    if (!item.uri) return Alert.alert('Playback error', 'No playable URL');
                    await player.playSong(item);
                    player.open(item);
                  }}
                  onPlayNow={async (s: any) => {
                    if (!s.uri) {
                      try {
                        const resp: any = await saavnApi.getSongById(s.id);
                        const obj = (resp?.data?.[0]) || resp?.data || resp;
                        s.uri = getPlayableUrl(obj) || s.uri;
                      } catch (e) { console.warn(e); }
                    }
                    if (!s.uri) return Alert.alert('Playback error', 'No playable URL');
                    await player.playSong(s);
                    player.open(s);
                  }}
                  onAddToQueue={(s: any) => player.addToQueue(s)}
                  onPlayNext={(s: any) => player.playNext(s)}
                  onGoToAlbum={(s: any) => {
                    if (!s.albumId) return;
                    (navigation as any).navigate('Album', {
                      album: {
                        id: s.albumId,
                        albumId: s.albumId,
                        title: s.album,
                        name: s.album,
                        image: s.artwork || s.image
                      }
                    });
                  }}
                />
                <IconButton 
                  icon="delete" 
                  onPress={() => removeSong(item?.id ?? index)}
                  style={{ position: 'absolute', right: 40, top: 8 }}
                  size={20}
                />
              </View>
            )}
            ListEmptyComponent={<View style={{ padding: 16 }}><Text>No favourite songs</Text></View>}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )
      ) : tab === 'albums' ? (
        loading ? (
          <View style={{ padding: 12 }}>
            <SkeletonTrack />
            <SkeletonTrack />
          </View>
        ) : (
          <FlatList
            data={albums}
            keyExtractor={(i, idx) => (i?.id ? String(i.id) : String(idx))}
            renderItem={({ item, index }) => (
              <View style={{ position: 'relative' }}>
                <MediaRow
                  item={{
                    ...item,
                    subtitle: String((item.songs || []).length) + ' songs'
                  }}
                  type="album"
                  label="Album"
                  iconName="album"
                  onPress={() => {
                    (navigation as any).navigate('Album', {
                      album: {
                        id: item.id,
                        albumId: item.id,
                        title: item.title,
                        name: item.title,
                        image: item.image
                      },
                      songs: item.songs
                    });
                  }}
                  showContextMenu={false}
                />
                <IconButton 
                  icon="delete" 
                  onPress={() => removeAlbum(item?.id ?? index)}
                  style={{ position: 'absolute', right: 8, top: 8 }}
                  size={20}
                />
              </View>
            )}
            ListEmptyComponent={<View style={{ padding: 16 }}><Text>No favourite albums</Text></View>}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )
      ) : tab === 'playlists' ? (
        loading ? (
          <View style={{ padding: 12 }}>
            <SkeletonTrack />
            <SkeletonTrack />
          </View>
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(i, idx) => (i?.id ? String(i.id) : String(idx))}
            renderItem={({ item, index }) => (
              <View style={{ position: 'relative' }}>
                <MediaRow
                  item={{
                    ...item,
                    subtitle: String((item.songs || []).length) + ' songs'
                  }}
                  type="playlist"
                  label="Playlist"
                  iconName="playlist-play"
                  onPress={() => {
                    (navigation as any).navigate('Playlist', {
                      playlist: {
                        id: item.id,
                        playlistId: item.id,
                        title: item.title,
                        name: item.title,
                        image: item.image,
                        songs: item.songs
                      }
                    });
                  }}
                  showContextMenu={false}
                />
                <IconButton 
                  icon="delete" 
                  onPress={() => removePlaylist(item?.id ?? index)}
                  style={{ position: 'absolute', right: 8, top: 8 }}
                  size={20}
                />
              </View>
            )}
            ListEmptyComponent={<View style={{ padding: 16 }}><Text>No favourite playlists</Text></View>}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )
      ) : (
        loading ? (
          <View style={{ padding: 12 }}>
            <SkeletonTrack />
            <SkeletonTrack />
          </View>
        ) : (
          <FlatList
            data={artists}
            keyExtractor={(i, idx) => (i?.id ? String(i.id) : String(idx))}
            renderItem={({ item, index }) => (
              <View style={{ position: 'relative' }}>
                <MediaRow
                  item={item}
                  type="artist"
                  label="Artist"
                  iconName="person"
                  shape="round"
                  onPress={() => {
                    (navigation as any).navigate('Artist', { 
                      id: item.id, 
                      artist: item 
                    });
                  }}
                  showContextMenu={false}
                />
                <IconButton 
                  icon="delete" 
                  onPress={() => removeArtist(item?.id ?? index)}
                  style={{ position: 'absolute', right: 8, top: 8 }}
                  size={20}
                />
              </View>
            )}
            ListEmptyComponent={<View style={{ padding: 16 }}><Text>No favourite artists</Text></View>}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )
      )}
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
});

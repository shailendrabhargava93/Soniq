import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Title, Button, IconButton, Card, Subheading, Avatar } from 'react-native-paper';
import { readFavourites, persistFavourites, FAVOURITE_SONGS_KEY, FAVOURITE_ALBUMS_KEY } from '../services/storageCompat';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import Header from '../components/Header';
import SimplePlayer from '../components/SimplePlayer';
import OfflineBanner from '../components/OfflineBanner';
import SkeletonTrack from '../components/SkeletonTrack';
import { saavnApi } from '../services/saavnApi';
import { cacheGet, cacheSet } from '../services/cache';
import { getPlayableUrl } from '../utils/normalize';

export default function FavouritesScreen() {
  const { theme } = useTheme();
  const player = usePlayer();
  const [tab, setTab] = useState<'songs' | 'albums'>('songs');
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = (await readFavourites(FAVOURITE_SONGS_KEY)) as any[];
        const a = (await readFavourites(FAVOURITE_ALBUMS_KEY)) as any[];

        // normalize songs: if partial (id only), try cache then fetch
        const normalizedSongs = await Promise.all((s || []).map(async (it: any) => {
          if (!it) return null;
          const id = it.id || it.songId || it.sid;
          if (!id) return it;
          // try cache
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
              artwork: obj.image || obj.cover || it.artwork || it.image
            };
            try { await cacheSet(`song:${id}`, mapped); } catch {}
            return mapped;
          } catch (e) {
            return it;
          }
        }));

        // normalize albums: fetch metadata if needed
        const normalizedAlbums = await Promise.all((a || []).map(async (it: any) => {
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

        if (!mounted) return;
        setSongs(normalizedSongs.filter(Boolean));
        setAlbums(normalizedAlbums.filter(Boolean));
      } catch (e: any) {
        console.warn('failed to load favourites', e);
        if (mounted) setError('Failed to load favourites');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const removeSong = async (idx: number) => {
    const next = [...songs];
    next.splice(idx, 1);
    setSongs(next);
    await persistFavourites(FAVOURITE_SONGS_KEY, next);
  };

  const removeAlbum = async (idx: number) => {
    const next = [...albums];
    next.splice(idx, 1);
    setAlbums(next);
    await persistFavourites(FAVOURITE_ALBUMS_KEY, next);
  };
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header onRecentlyPlayedClick={() => { /* navigate if needed */ }} onSettingsClick={() => { /* navigate */ }} />
      <OfflineBanner />
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title>Favourites</Title>
          <View style={{ flexDirection: 'row' }}>
            <Button mode={tab === 'songs' ? 'contained' : 'outlined'} onPress={() => setTab('songs')}>Songs</Button>
            <Button mode={tab === 'albums' ? 'contained' : 'outlined'} onPress={() => setTab('albums')} style={{ marginLeft: 8 }}>Albums</Button>
          </View>
        </View>
      </View>

      {error ? (
        <View style={{ padding: 16 }}>
          <Subheading style={{ color: theme.colors.error }}>{error}</Subheading>
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
          <FlatList data={songs} keyExtractor={(i, idx) => (i?.id ? String(i.id) : String(idx))} renderItem={({ item, index }) => (
            <TouchableOpacity onPress={async () => { if (!item.uri) { try { const resp: any = await saavnApi.getSongById(item.id); const obj = (resp?.data?.[0]) || resp?.data || resp; item.uri = getPlayableUrl(obj) || item.uri; } catch (e) { console.warn(e); } } if (!item.uri) return Alert.alert('Playback error','No playable URL'); await player.playSong(item); player.open(item); }}>
              <Card style={{ marginHorizontal: 12, marginVertical: 6 }}>
                <Card.Title title={item.title} subtitle={item.artist} left={() => <Avatar.Image size={48} source={ item.artwork ? { uri: item.artwork } : require('../../assets/icon.png')} />} right={() => <IconButton icon="delete" onPress={() => removeSong(index)} />} />
              </Card>
            </TouchableOpacity>
          )} ListEmptyComponent={<View style={{ padding: 16 }}><Text>No favourite songs</Text></View>} />
        )
      ) : (
        loading ? (
          <View style={{ padding: 12 }}>
            <SkeletonTrack />
            <SkeletonTrack />
          </View>
        ) : (
          <FlatList data={albums} keyExtractor={(i, idx) => (i?.id ? String(i.id) : String(idx))} renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => player.open(item)}>
              <Card style={{ marginHorizontal: 12, marginVertical: 6 }}>
                <Card.Title title={item.title} subtitle={String((item.songs || []).length) + ' songs'} left={() => <Avatar.Image size={56} source={ item.image ? { uri: item.image } : require('../../assets/icon.png')} />} right={() => <IconButton icon="delete" onPress={() => removeAlbum(index)} />} />
              </Card>
            </TouchableOpacity>
          )} ListEmptyComponent={<View style={{ padding: 16 }}><Text>No favourite albums</Text></View>} />
        )
      )}

      {/* Simple player dock */}
      {player.currentSong ? (
        <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.outline, backgroundColor: theme.colors.surface }}>
          <SimplePlayer track={player.currentSong as any} />
        </View>
      ) : null}
    </View>
  );
}

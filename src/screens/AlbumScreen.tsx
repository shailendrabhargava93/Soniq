import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, Share } from 'react-native';
import { Title, Card, Subheading, Button, IconButton, Avatar } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { saavnApi } from '../services/saavnApi';
import TrackList from '../components/TrackList';
import SongRow from '../components/SongRow';
import OfflineBanner from '../components/OfflineBanner';
import { usePlayer } from '../contexts/PlayerContext';
import { decodeHtmlEntities, getBestImage } from '../utils/normalize';
import { cacheGet, cacheSet } from '../services/cache';
import { Menu } from 'react-native-paper';

interface AlbumScreenProps {}

const AlbumScreen: React.FC<AlbumScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { album } = route.params as { album: any };
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleMenu, setVisibleMenu] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(25);
  const player = usePlayer();
  const { theme } = useTheme();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // try cache first
        const cacheKey = `album:${album?.id || album?.albumId || album?.sid}`;
        const cached = await cacheGet(cacheKey, 1000 * 60 * 60 * 24);
        if (cached) {
          setSongs(cached);
        }

        const resp: any = await saavnApi.getAlbumById(album?.id || album?.albumId || album?.sid);
        const data = resp?.data || resp;
        const songsArr = Array.isArray(data?.data?.songs) ? data.data.songs : Array.isArray(data?.songs) ? data.songs : (Array.isArray(data) ? data : []);
        const mapped = songsArr.map((s: any) => ({
          id: s.id || s.sid || s.songid,
          title: decodeHtmlEntities(s.title || s.name || ''),
          artist: s.subtitle || s.artist || '',
          uri: s.media_url || s.media_preview_url || s.downloadUrl || s.perma_url || s.url || '',
          artwork: getBestImage(s.image || s.images || album?.image)
        }));
        if (mounted) setSongs(mapped);
        // cache for later
        try { await cacheSet(cacheKey, mapped); } catch {}
      } catch (e) {
        console.error('Failed to load album songs', e);
        Alert.alert('Error', 'Failed to load album tracks');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [album]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: theme.colors.surface }}>
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} onPress={() => navigation.goBack()} />
        <Title style={{ color: theme.colors.onSurface, marginLeft: 12 }}>{album?.title || 'Album'}</Title>
      </View>
      <OfflineBanner />
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={songs.slice(0, displayCount)}
        keyExtractor={(i) => i.id}
        onEndReached={() => setDisplayCount((c) => Math.min(songs.length, c + 25))}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Card style={{ width: 160, height: 160, borderRadius: 8, overflow: 'hidden' }}>
            <Card.Cover
              source={album?.image ? { uri: album.image } : require('../../assets/icon.png')}
              style={{ width: 160, height: 160 }}
            />
          </Card>
          <Text style={{ marginTop: 8, color: '#999' }}>{songs.length} songs</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
          <IconButton icon={({ size, color }) => <MaterialIcons name="shuffle" size={size} color={color} />} onPress={async () => {
            // Shuffle play all: play first song after shuffling (simple placeholder)
            if (songs.length === 0) return;
            const s = songs[0];
            if (!s.uri) {
              try {
                const resp: any = await saavnApi.getSongById(s.id);
                const songObj = (resp?.data?.[0]) || resp?.data || resp;
                const { getPlayableUrl } = await import('../utils/normalize');
                s.uri = getPlayableUrl(songObj) || s.uri;
              } catch (e) { console.warn('shuffle fetch failed', e); }
            }
            if (!s.uri) return Alert.alert('Playback error', 'No playable URL');
            await player.playSong({ id: s.id, title: s.title, artist: s.artist, uri: s.uri, artwork: s.artwork });
          }} size={36} />

          <TouchableOpacity onPress={async () => {
            if (songs.length === 0) return;
            const s = songs[0];
            if (!s.uri) {
              try {
                const resp: any = await saavnApi.getSongById(s.id);
                const songObj = (resp?.data?.[0]) || resp?.data || resp;
                const { getPlayableUrl } = await import('../utils/normalize');
                s.uri = getPlayableUrl(songObj) || s.uri;
              } catch (e) { console.warn('playall fetch failed', e); }
            }
            if (!s.uri) return Alert.alert('Playback error', 'No playable URL');
            await player.playSong({ id: s.id, title: s.title, artist: s.artist, uri: s.uri, artwork: s.artwork });
          }} style={{ marginHorizontal: 12, backgroundColor: theme.colors.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="play-arrow" size={28} color={theme.colors.onPrimary || '#fff'} />
          </TouchableOpacity>

          <IconButton icon={({ size, color }) => <MaterialIcons name="favorite-border" size={size} color={color} />} onPress={async () => {
            // Toggle favourite for album (placeholder)
            Alert.alert('Favorite', 'Album added to favourites');
          }} size={36} />
        </View>
        </>}
        renderItem={({ item, index }) => (
          <SongRow
            song={item}
            onPress={async () => {
              if (!item.uri) {
                try {
                  const resp: any = await saavnApi.getSongById(item.id);
                  const songObj = (resp?.data?.[0]) || resp?.data || resp;
                  const { getPlayableUrl } = await import('../utils/normalize');
                  item.uri = getPlayableUrl(songObj) || item.uri;
                } catch (e) { console.warn(e); }
              }
              if (!item.uri) return Alert.alert('Playback error', 'No playable URL');
              await player.playSong({ id: item.id, title: item.title, artist: item.artist, uri: item.uri, artwork: item.artwork });
              player.open({ id: item.id, title: item.title, artist: item.artist, uri: item.uri, artwork: item.artwork });
            }}
            onPlayNow={async (s) => {
              if (!s.uri) {
                try { const resp: any = await saavnApi.getSongById(s.id); const songObj = (resp?.data?.[0]) || resp?.data || resp; const { getPlayableUrl } = await import('../utils/normalize'); s.uri = getPlayableUrl(songObj) || s.uri; } catch (e) { console.warn(e); }
              }
              if (!s.uri) return Alert.alert('Playback error', 'No playable URL');
              await player.playSong({ id: s.id, title: s.title, artist: s.artist, uri: s.uri, artwork: s.artwork });
              player.open({ id: s.id, title: s.title, artist: s.artist, uri: s.uri, artwork: s.artwork });
            }}
            onAddToQueue={(s) => player.addToQueue(s)}
            onPlayNext={(s) => player.playNext(s)}
          />
        )}
        ListEmptyComponent={loading ? <Text>Loading...</Text> : <Text style={{ padding: 16 }}>No tracks</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  albumCover: {
    height: 300,
    borderRadius: 8,
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  albumArtist: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  albumDescription: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default AlbumScreen;
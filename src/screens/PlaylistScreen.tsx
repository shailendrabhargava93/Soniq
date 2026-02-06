import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, Share, ActivityIndicator } from 'react-native';
import { Title, Card, Subheading, Button, IconButton, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import TrackList from '../components/TrackList';
import SongRow from '../components/SongRow';
import OfflineBanner from '../components/OfflineBanner';
import { usePlayer } from '../contexts/PlayerContext';
import { saavnApi } from '../services/saavnApi';
import { getBestImage, joinArtistNames, decodeHtmlEntities } from '../utils/normalize';
import { Menu } from 'react-native-paper';
import { cacheGet, cacheSet } from '../services/cache';

interface PlaylistScreenProps {}

const PlaylistScreen: React.FC<PlaylistScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { playlist } = route.params as { playlist: any };
  const player = usePlayer();
  const [visibleMenu, setVisibleMenu] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(25);
  const [songs, setSongs] = useState<any[]>(() => Array.isArray(playlist?.songs) ? playlist.songs.map((s: any) => ({
    id: s.id || s.sid || s.songid,
    title: decodeHtmlEntities(s.title || s.name || s.song || ''),
    artist: decodeHtmlEntities(s.subtitle || s.artist || joinArtistNames(s.singers || s.more || s.artists)),
    artwork: s.image || playlist?.image || getBestImage(playlist?.image),
    uri: s.uri || ''
  })) : []);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (songs.length > 0) return; // already have songs
      setLoading(true);
      const cacheKey = `playlist:${playlist?.id || playlist?.pid || playlist?.playlistId}`;
      try {
        const cached = await cacheGet(cacheKey, 1000 * 60 * 60 * 24);
        if (cached && mounted) {
          setSongs(cached);
        }
        const resp: any = await saavnApi.getPlaylistById(playlist?.id || playlist?.pid || playlist?.playlistId || playlist?.sid);
        const data = resp?.data || resp;
        const songsArr = Array.isArray(data?.data?.songs) ? data.data.songs : Array.isArray(data?.songs) ? data.songs : (Array.isArray(data) ? data : []);
        const mapped = songsArr.map((s: any) => ({
          id: s.id || s.sid || s.songid,
          title: decodeHtmlEntities(s.title || s.name || s.song || ''),
          artist: decodeHtmlEntities(s.subtitle || s.artist || joinArtistNames(s.singers || s.more || s.artists)),
          artwork: s.image || getBestImage(playlist?.image) || playlist?.image,
          uri: ''
        }));
        if (mounted) setSongs(mapped);
        try { await cacheSet(cacheKey, mapped); } catch {}
      } catch (e) {
        console.warn('Failed to load playlist details', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [playlist]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: theme.colors.surface }}>
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} onPress={() => navigation.goBack()} />
        <Title style={{ color: theme.colors.onSurface, marginLeft: 12 }}>{playlist?.name || playlist?.title || 'Playlist'}</Title>
      </View>
      <OfflineBanner />
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={songs.slice(0, displayCount)}
        keyExtractor={(i, idx) => (i?.id?.toString ? i.id.toString() : String(idx))}
        onEndReached={() => setDisplayCount((c) => Math.min(songs.length, c + 25))}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Card style={{ width: 160, height: 160, borderRadius: 8, overflow: 'hidden' }}>
            <Card.Cover
              source={ (playlist?.image || playlist?.thumbnail) ? { uri: getBestImage(playlist?.image || playlist?.thumbnail) } : require('../../assets/soniq-logo.png') }
              style={{ width: 160, height: 160 }}
            />
          </Card>
          <Text style={{ marginTop: 8, color: '#999' }}>{(playlist?.songCount || songs.length) || 0} songs</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
          <IconButton icon={({ size, color }) => <MaterialIcons name="shuffle" size={size} color={color} />} onPress={() => Alert.alert('Shuffle', 'Shuffle play (not implemented)')} size={36} />
          <TouchableOpacity style={{ marginHorizontal: 12, backgroundColor: theme.colors.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }} onPress={async () => {
            if (songs.length === 0) return;
            const s = songs[0];
            if (!s.uri) {
              try {
                const resp: any = await saavnApi.getSongById(s.id);
                const songObj = (resp?.data?.[0]) || resp?.data || resp;
                const { getPlayableUrl } = await import('../utils/normalize');
                s.uri = getPlayableUrl(songObj) || s.uri;
              } catch (e) { console.warn('play fetch failed', e); }
            }
            if (!s.uri) return Alert.alert('Playback error', 'No playable URL');
            await player.playSong({ id: s.id, title: s.title, artist: s.artist, uri: s.uri, artwork: s.artwork });
            player.open({ id: s.id, title: s.title, artist: s.artist, uri: s.uri, artwork: s.artwork });
          }}>
            <MaterialIcons name="play-arrow" size={28} color={theme.colors.onPrimary || '#fff'} />
          </TouchableOpacity>
          <IconButton icon={({ size, color }) => <MaterialIcons name="favorite-border" size={size} color={color} />} onPress={() => Alert.alert('Favourite', 'Added to favourites')} size={36} />
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
        ListEmptyComponent={loading ? <View style={{ padding: 16, alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View> : <Text style={{ padding: 16 }}>No tracks</Text>}
      />

      <Button
        mode="contained"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16, margin: 16 }}
      >
        Go Back
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  playlistCover: {
    height: 300,
    borderRadius: 8,
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  playlistSubtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  playlistDescription: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default PlaylistScreen;
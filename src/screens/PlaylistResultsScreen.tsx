import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import { Text } from "react-native-paper";
import { useTheme } from '../contexts/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import { saavnApi } from '../services/saavnApi';
import { getBestImage } from '../utils/normalize';

const HEADER_HEIGHT = 60;

export default function PlaylistResultsScreen() {
  const { theme } = useTheme();
  const route = useRoute();
  const nav = useNavigation();
  const { title, data } = route.params as { title: string; data: any[] };
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[PlaylistResults] Received data:', data);
    const normalized = Array.isArray(data) ? data : [];
    console.log('[PlaylistResults] Normalized playlists count:', normalized.length);
    setPlaylists(normalized);

    // Fetch full details for each playlist if needed
    if (normalized.length > 0) {
      (async () => {
        const updated = await Promise.all(
          normalized.map(async (p) => {
            try {
              const id = p.id || p.playlistId || p.pid || p.listid;
              if (!id) {
                console.warn('[PlaylistResults] No ID found for playlist:', p);
                return p;
              }
              console.log('[PlaylistResults] Fetching details for playlist:', id);
              const res: any = await (saavnApi as any).getPlaylistById(id.toString(), 10);
              const got = res?.data || res || {};
              const image = getBestImage(got.image || got.thumbnail || p.image || p.thumbnail);
              const count = Array.isArray(got.songs) ? got.songs.length : (got.songCount || got.song_count || got.trackCount || p.songCount || p.song_count || p.trackCount || 0);
              return { ...p, image, songCount: count, _detail: got };
            } catch (e) {
              console.warn('[PlaylistResults] Failed to fetch playlist details:', e);
              return p;
            }
          })
        );
        console.log('[PlaylistResults] Updated playlists:', updated.length);
        setPlaylists(updated);
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && playlists.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
          <Header title={title} showBack onBack={() => (nav as any).goBack()} />
        </View>
        <View style={{ flex: 1, paddingTop: HEADER_HEIGHT }}>
          <SkeletonLoader type="grid" count={6} />
        </View>
      </View>
    );
  }

  if (playlists.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
          <Header title={title} showBack onBack={() => (nav as any).goBack()} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: HEADER_HEIGHT }}>
          <Text style={{ color: theme.colors.onSurface }}>No playlists found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
        <Header title={title} showBack onBack={() => (nav as any).goBack()} hideThemeToggle />
      </View>
      <FlatList
        data={playlists}
        keyExtractor={(i) => (i?.id?.toString && i.id.toString()) || Math.random().toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: HEADER_HEIGHT + 8, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => {
              try { (nav as any).navigate('Playlist', { playlist: item }); }
              catch (e) { Alert.alert('Navigation error'); }
            }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
          >
            <Image 
              source={{ uri: getBestImage(item.image || item.thumbnail) || 'https://picsum.photos/seed/playlist/56/56' }} 
              style={{ width: 56, height: 56, borderRadius: 4, marginRight: 12, backgroundColor: '#333' }} 
            />
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge" numberOfLines={2} style={{ color: theme.colors.onSurface, fontSize: 15, marginBottom: 2 }}>{item.name || item.title}</Text>
              <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>{`${item.songCount || item.song_count || item.trackCount || 0} songs`}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
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

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Title, Subheading, Card, Avatar, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import SimplePlayer from '../components/SimplePlayer';
import HorizontalScroller from '../components/HorizontalScroller';
import SongItem from '../components/SongItem';
import { saavnApi } from '../services/saavnApi';
import { getMeta } from '../services/storageCompat';
import { decodeHtmlEntities, getBestImage } from '../utils/normalize';
import type { Track } from '../types/api';

const pickImage = (img: any) => getBestImage(img);

export default function Home() {
  const nav = useNavigation();
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<any[]>([]);
  const [charts, setCharts] = useState<any[]>([]);
  const [launchPayload, setLaunchPayload] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadCachedLaunch = async () => {
      try {
        console.log('[Home] Loading cached launch...');
        const cached = await getMeta('launch');
        console.log('[Home] Cached launch:', cached ? Object.keys(cached) : 'null');
        if (cached) {
          setLaunchPayload(cached);
          const launchData = cached?.data || cached;
          console.log('[Home] launchData keys:', Object.keys(launchData));
          const albumsSource = Array.isArray(launchData?.new_albums) ? launchData.new_albums : [];
          const chartsSource = Array.isArray(launchData?.top_charts) ? launchData.top_charts : (Array.isArray(launchData?.top_songs) ? launchData.top_songs : []);
          console.log('[Home] Albums source length:', albumsSource.length, 'charts length:', chartsSource.length);
          setAlbums(albumsSource.map((a: any) => ({ 
            id: a.id || a.sid || Math.random().toString(), 
            title: decodeHtmlEntities(a.title || a.name || ''), 
            artist: a.subtitle || a.music || a.artist_name || (a.more_info?.artistMap?.artists?.[0]?.name) || '',
            image: pickImage(a.image || a.images || a.imageUrl) 
          })));
          setCharts(chartsSource.map((c: any) => ({ 
            id: c.id || c.songId || c.sid || Math.random().toString(), 
            title: decodeHtmlEntities(c.title || c.name || c.song || c.trackName || ''), 
            subtitle: c.subtitle || c.header_desc || c.description || '',
            image: pickImage(c.image || c.images || c.thumbnail || c.cover) 
          })));
        }
      } catch (e) {
        console.error('[Home] Failed to load cached launch:', e);
      }
    };

    (async () => {
      try {
        setLoading(true);
        // load cached payload quickly
        await loadCachedLaunch();

        // Fetch fresh launch payload
        try {
          console.log('[Home] Calling saavnApi.launch()...');
          const payload = (await saavnApi.launch()) as any;
          console.log('[Home] Launch API returned:', payload ? Object.keys(payload) : 'null');
          if (!mounted) return;
          if (payload) {
            setLaunchPayload(payload || null);
            const launchData = payload?.data || payload;
            const albumsSource = Array.isArray(launchData?.new_albums) ? launchData.new_albums : [];
            const chartsSource = Array.isArray(launchData?.top_charts) ? launchData.top_charts : (Array.isArray(launchData?.top_songs) ? launchData.top_songs : []);
            console.log('[Home] Fresh albums length:', albumsSource.length, 'charts length:', chartsSource.length);
            setAlbums(albumsSource.map((a: any) => ({ 
              id: a.id || a.sid || Math.random().toString(), 
              title: decodeHtmlEntities(a.title || a.name || ''), 
              artist: a.subtitle || a.music || a.artist_name || (a.more_info?.artistMap?.artists?.[0]?.name) || '',
              image: pickImage(a.image || a.images || a.imageUrl) 
            })));
            setCharts(chartsSource.map((c: any) => ({ 
              id: c.id || c.songId || c.sid || Math.random().toString(), 
              title: decodeHtmlEntities(c.title || c.name || c.song || c.trackName || ''), 
              subtitle: c.subtitle || c.header_desc || c.description || '',
              image: pickImage(c.image || c.images || c.thumbnail || c.cover) 
            })));
          }
        } catch (err) {
          console.error('[Home] Launch fetch failed', err);
        }

      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // reload cache when screen gains focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const cached = await getMeta('launch');
          if (cached && active) {
            setLaunchPayload(cached);
            const launchData = cached?.data || cached;
            const albumsSource = Array.isArray(launchData?.new_albums) ? launchData.new_albums : [];
            setAlbums(albumsSource.map((a: any) => ({ 
              id: a.id || a.sid || Math.random().toString(), 
              title: decodeHtmlEntities(a.title || a.name || ''), 
              artist: a.subtitle || a.music || a.artist_name || (a.more_info?.artistMap?.artists?.[0]?.name) || '',
              image: pickImage(a.image || a.images || a.imageUrl) 
            })));
          }
        } catch {}
      })();
      return () => { active = false; };
    }, [])
  );

  const renderAlbum = ({ item }: { item: any }) => (
    <Card style={{ width: 140, marginRight: 12 }}>
      <Card.Cover source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } style={styles.albumImage} />
      <Card.Content>
        <Title numberOfLines={2} style={styles.albumTitle}>{item.title}</Title>
        {item.artist ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.artist}</Subheading> : null}
      </Card.Content>
    </Card>
  );

  const renderChart = ({ item }: { item: any }) => (
    <Card style={{ width: 140, marginRight: 12 }}>
      <Card.Cover source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } style={styles.albumImage} />
      <Card.Content>
        <Title numberOfLines={2} style={styles.albumTitle}>{item.title}</Title>
        {item.subtitle ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.subtitle}</Subheading> : null}
      </Card.Content>
    </Card>
  );

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;

  const noData = !albums.length && !charts.length && (!launchPayload || Object.keys(launchPayload).length === 0);
  if (noData) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>No data available. Check your network or try reloading the app.</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <FlatList
        data={[{ key: 'content' }]}
        keyExtractor={i => i.key}
        renderItem={() => (
          <View style={{ padding: 16 }}>
            {/* New Albums Section */}
            <View style={styles.sectionHeaderRow}>
              <Title style={styles.sectionTitle}>New Albums</Title>
            </View>
            <FlatList 
              data={albums.slice(0, 10)} 
              keyExtractor={i => i.id.toString()} 
              horizontal 
              renderItem={renderAlbum} 
              showsHorizontalScrollIndicator={false} 
              style={{ marginBottom: 24 }} 
            />

            {/* Trending Songs Section (Top 10) */}
            {charts.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Title style={styles.sectionTitle}>Trending Songs</Title>
                </View>
                <FlatList 
                  data={charts.slice(0, 10)} 
                  keyExtractor={i => i.id.toString()} 
                  horizontal 
                  renderItem={renderChart} 
                  showsHorizontalScrollIndicator={false} 
                  style={{ marginBottom: 24 }} 
                />
              </>
            )}

            {/* Trending Playlists Section */}
            {launchPayload ? (
              (() => {
                const launchData = launchPayload?.data || launchPayload;
                const playlists = Array.isArray(launchData?.top_playlists) ? launchData.top_playlists : (Array.isArray(launchData?.playlists) ? launchData.playlists : []);
                console.log('[Home] Playlists count:', playlists.length);
                
                if (playlists.length === 0) return null;
                
                return (
                  <View style={{ marginBottom: 24 }}>
                    <View style={styles.sectionHeaderRow}>
                      <Title style={styles.sectionTitle}>Trending Playlists</Title>
                    </View>
                    <FlatList 
                      data={playlists.slice(0, 10).map((it: any, idx: number) => ({ 
                        ...it, 
                        id: it.id ?? it.sid ?? idx,
                        title: decodeHtmlEntities(it.title || it.name || ''),
                        image: pickImage(it.image || it.images)
                      }))} 
                      keyExtractor={(i: any) => i.id.toString()} 
                      horizontal 
                        renderItem={({ item }) => (
                        <Card style={{ width: 140, marginRight: 12 }}>
                          <Card.Cover source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } style={styles.albumImage} />
                          <Card.Content>
                            <Title numberOfLines={2} style={styles.albumTitle}>{item.title}</Title>
                          </Card.Content>
                        </Card>
                      )} 
                      showsHorizontalScrollIndicator={false} 
                    />
                  </View>
                );
              })()
            ) : null}

            {/* Top Charts Section */}
            {launchPayload ? (
              (() => {
                const launchData = launchPayload?.data || launchPayload;
                const topCharts = Array.isArray(launchData?.top_charts) ? launchData.top_charts : (Array.isArray(launchData?.charts) ? launchData.charts : []);
                console.log('[Home] Top Charts count:', topCharts.length);
                
                if (topCharts.length === 0) return null;
                
                return (
                  <View style={{ marginBottom: 24 }}>
                    <View style={styles.sectionHeaderRow}>
                      <Title style={styles.sectionTitle}>Top Charts</Title>
                    </View>
                    <FlatList 
                      data={topCharts.slice(0, 10).map((it: any, idx: number) => ({ 
                        ...it, 
                        id: it.id ?? it.sid ?? idx,
                        title: decodeHtmlEntities(it.title || it.name || ''),
                        artist: it.subtitle || (it.artists?.primary?.[0]?.name) || 'Various Artists',
                        image: pickImage(it.image || it.images)
                      }))} 
                      keyExtractor={(i: any) => i.id.toString()} 
                      horizontal 
                      renderItem={({ item }) => (
                        <Card style={{ width: 140, marginRight: 12 }}>
                          <Card.Cover source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } style={styles.albumImage} />
                          <Card.Content>
                            <Title numberOfLines={2} style={styles.albumTitle}>{item.title}</Title>
                            {item.artist ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.artist}</Subheading> : null}
                          </Card.Content>
                        </Card>
                      )} 
                      showsHorizontalScrollIndicator={false} 
                    />
                  </View>
                );
              })()
            ) : null}

            {/* Recommended Artists Section */}
            {launchPayload ? (
              (() => {
                const launchData = launchPayload?.data || launchPayload;
                const artists = Array.isArray(launchData?.artist_recos) ? launchData.artist_recos : 
                                (Array.isArray(launchData?.top_artists) ? launchData.top_artists : 
                                (Array.isArray(launchData?.artists) ? launchData.artists : []));
                console.log('[Home] Artists count:', artists.length);
                
                if (artists.length === 0) return null;
                
                return (
                  <View style={{ marginBottom: 24 }}>
                    <View style={styles.sectionHeaderRow}>
                      <Title style={styles.sectionTitle}>Recommended Artists</Title>
                    </View>
                    <FlatList 
                      data={artists.slice(0, 6).map((it: any, idx: number) => ({ 
                        ...it, 
                        id: it.id ?? idx,
                        name: decodeHtmlEntities(it.name || it.title || ''),
                        image: pickImage(it.image || it.images)
                      }))} 
                      keyExtractor={(i: any) => i.id.toString()} 
                      horizontal 
                      renderItem={({ item }) => (
                        <View style={{ width: 110, marginRight: 12, alignItems: 'center' }}>
                          <Avatar.Image source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } size={110} style={{ backgroundColor: '#ddd', marginBottom: 6 }} />
                          <Subheading numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{item.name}</Subheading>
                        </View>
                      )} 
                      showsHorizontalScrollIndicator={false} 
                    />
                  </View>
                );
              })()
            ) : null}
          </View>
        )}
      />
      {/* FullPlayer is rendered at app root by PlayerProvider */}
    </View>
  );
}

const styles = StyleSheet.create({
  albumImage: { width: 140, height: 140, borderRadius: 6, backgroundColor: '#ddd' },
  albumTitle: { marginTop: 6, fontSize: 13, fontWeight: '600' },
  albumArtist: { marginTop: 2, fontSize: 11, color: '#666' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  chartRow: { flexDirection: 'row', alignItems: 'center' },
  chartImage: { width: 56, height: 56, borderRadius: 4, backgroundColor: '#ddd' },
});

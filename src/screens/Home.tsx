import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Title, Subheading, Card, Avatar, IconButton } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
// Header is provided by react-navigation AppBar now
import MiniPlayer from '../components/MiniPlayer';
import HorizontalScroller from '../components/HorizontalScroller';
import MusicCard from '../components/MusicCard';
import { usePlayer } from '../contexts/PlayerContext';
import { saavnApi } from '../services/saavnApi';
import { getMeta } from '../services/storageCompat';
import { decodeHtmlEntities, getBestImage } from '../utils/normalize';
import type { Track } from '../types/api';

const pickImage = (img: any) => getBestImage(img);

export default function Home() {
  const nav = useNavigation();
  const { currentSong, isPlaying, playSong, pauseSong, nextSong, previousSong, open } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [topCharts, setTopCharts] = useState<any[]>([]);
  const [trendingPlaylists, setTrendingPlaylists] = useState<any[]>([]);
  const [recommendedArtists, setRecommendedArtists] = useState<any[]>([]);
  const [launchPayload, setLaunchPayload] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadCachedLaunch = async () => {
      try {
        console.log('[Home] Loading cached launch...');
        const cached = await getMeta('launch');
        if (cached) {
          setLaunchPayload(cached);
          const data = cached?.data || cached;
          
          // Parse new_albums
          if (Array.isArray(data?.new_albums)) {
            setNewAlbums(data.new_albums.slice(0, 10).map((a: any) => ({ 
              id: a.id || Math.random().toString(), 
              title: decodeHtmlEntities(a.title || ''), 
              artist: a.subtitle || '',
              image: pickImage(a.image),
              type: a.type,
              perma_url: a.perma_url
            })));
          }
          
          // Parse new_trending (trending songs)
          if (Array.isArray(data?.new_trending)) {
            setTrendingSongs(data.new_trending.slice(0, 10).map((s: any) => ({ 
              id: s.id || Math.random().toString(), 
              title: decodeHtmlEntities(s.title || ''), 
              subtitle: s.subtitle || '',
              image: pickImage(s.image),
              type: s.type,
              perma_url: s.perma_url
            })));
          }
          
          // Parse charts
          if (Array.isArray(data?.charts)) {
            setTopCharts(data.charts.slice(0, 10).map((c: any) => ({ 
              id: c.id || Math.random().toString(), 
              title: decodeHtmlEntities(c.title || ''), 
              subtitle: c.subtitle || '',
              image: pickImage(c.image),
              type: c.type,
              perma_url: c.perma_url
            })));
          }

          // Parse trending playlists
          if (Array.isArray(data?.top_playlists)) {
            setTrendingPlaylists(data.top_playlists.slice(0, 10).map((p: any) => ({
              id: p.id || Math.random().toString(),
              title: decodeHtmlEntities(p.title || ''),
              subtitle: p.subtitle || `${p.song_count || 0} songs`,
              image: pickImage(p.image),
              type: p.type,
              perma_url: p.perma_url
            })));
          }

          // Parse recommended artists
          if (Array.isArray(data?.artist_recos)) {
            setRecommendedArtists(data.artist_recos.slice(0, 6).map((a: any) => ({
              id: a.id || Math.random().toString(),
              name: decodeHtmlEntities(a.name || a.title || ''),
              image: pickImage(a.image),
              type: a.type,
              perma_url: a.perma_url
            })));
          }
        }
      } catch (e) {
        console.error('[Home] Failed to load cached launch:', e);
      }
    };

    (async () => {
      try {
        setLoading(true);
        await loadCachedLaunch();

        try {
          console.log('[Home] Calling saavnApi.launch()...');
          const payload = (await saavnApi.launch()) as any;
          console.log('[Home] Launch API returned:', payload ? 'success' : 'null');
          if (!mounted) return;
          if (payload) {
            setLaunchPayload(payload);
            const data = (payload as any)?.data || payload;
            
            // Parse new_albums
            if (Array.isArray(data?.new_albums)) {
              setNewAlbums(data.new_albums.slice(0, 10).map((a: any) => ({ 
                id: a.id || Math.random().toString(), 
                title: decodeHtmlEntities(a.title || ''), 
                artist: a.subtitle || '',
                image: pickImage(a.image),
                type: a.type,
                perma_url: a.perma_url
              })));
            }
            
            // Parse new_trending
            if (Array.isArray(data?.new_trending)) {
              setTrendingSongs(data.new_trending.slice(0, 10).map((s: any) => ({ 
                id: s.id || Math.random().toString(), 
                title: decodeHtmlEntities(s.title || ''), 
                subtitle: s.subtitle || '',
                image: pickImage(s.image),
                type: s.type,
                perma_url: s.perma_url
              })));
            }
            
            // Parse charts
            if (Array.isArray(data?.charts)) {
              setTopCharts(data.charts.slice(0, 10).map((c: any) => ({ 
                id: c.id || Math.random().toString(), 
                title: decodeHtmlEntities(c.title || ''), 
                subtitle: c.subtitle || '',
                image: pickImage(c.image),
                type: c.type,
                perma_url: c.perma_url
              })));
            }

            // Parse trending playlists
            if (Array.isArray(data?.top_playlists)) {
              setTrendingPlaylists(data.top_playlists.slice(0, 10).map((p: any) => ({
                id: p.id || Math.random().toString(),
                title: decodeHtmlEntities(p.title || ''),
                subtitle: p.subtitle || `${p.song_count || 0} songs`,
                image: pickImage(p.image),
                type: p.type,
                perma_url: p.perma_url
              })));
            }

            // Parse recommended artists
            if (Array.isArray(data?.artist_recos)) {
              setRecommendedArtists(data.artist_recos.slice(0, 6).map((a: any) => ({
                id: a.id || Math.random().toString(),
                name: decodeHtmlEntities(a.name || a.title || ''),
                image: pickImage(a.image),
                type: a.type,
                perma_url: a.perma_url
              })));
            }
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

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const payload = await saavnApi.launch();
      if (payload) {
        setLaunchPayload(payload);
        const data = (payload as any)?.data || payload;
        
        // Update all data arrays
        if (Array.isArray(data?.new_albums)) {
          setNewAlbums(data.new_albums.slice(0, 10).map((a: any) => ({ 
            id: a.id || Math.random().toString(), 
            title: decodeHtmlEntities(a.title || ''), 
            artist: a.subtitle || '',
            image: pickImage(a.image),
            type: a.type,
            perma_url: a.perma_url
          })));
        }
        
        if (Array.isArray(data?.new_trending)) {
          setTrendingSongs(data.new_trending.slice(0, 10).map((s: any) => ({ 
            id: s.id || Math.random().toString(), 
            title: decodeHtmlEntities(s.title || ''), 
            subtitle: s.subtitle || '',
            image: pickImage(s.image),
            type: s.type,
            perma_url: s.perma_url
          })));
        }
        
        if (Array.isArray(data?.charts)) {
          setTopCharts(data.charts.slice(0, 10).map((c: any) => ({ 
            id: c.id || Math.random().toString(), 
            title: decodeHtmlEntities(c.title || ''), 
            subtitle: c.subtitle || '',
            image: pickImage(c.image),
            type: c.type,
            perma_url: c.perma_url
          })));
        }

        if (Array.isArray(data?.top_playlists)) {
          setTrendingPlaylists(data.top_playlists.slice(0, 10).map((p: any) => ({
            id: p.id || Math.random().toString(),
            title: decodeHtmlEntities(p.title || ''),
            subtitle: p.subtitle || `${p.song_count || 0} songs`,
            image: pickImage(p.image),
            type: p.type,
            perma_url: p.perma_url
          })));
        }

        if (Array.isArray(data?.artist_recos)) {
          setRecommendedArtists(data.artist_recos.slice(0, 6).map((a: any) => ({
            id: a.id || Math.random().toString(),
            name: decodeHtmlEntities(a.name || a.title || ''),
            image: pickImage(a.image),
            type: a.type,
            perma_url: a.perma_url
          })));
        }
      }
    } catch (error) {
      console.error('[Home] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Navigation handlers
  const handleItemPress = useCallback((item: any, type: string) => {
    // Navigate to appropriate screen based on type
    (async () => {
      try {
        if (type === 'album') {
          // open album screen (AlbumScreen will fetch its tracks)
          (nav as any).navigate('Album', { album: item });
          return;
        }

        if (type === 'song') {
          // fetch song metadata and play
          try {
            const resp = await saavnApi.getSongById(item.id || item.sid || item.songid);
            const songData = (resp as any)?.data?.[0] || (resp as any)?.data?.songs?.[0] || (resp as any)?.data || resp;
            
            // Extract playable URL from downloadUrl array (prefer highest quality)
            let uri = '';
            if (Array.isArray(songData?.downloadUrl) && songData.downloadUrl.length > 0) {
              // Sort by quality (highest first) and pick the first one
              const sortedUrls = songData.downloadUrl.sort((a: any, b: any) => {
                const qualityA = parseInt(a.quality?.replace('kbps', '') || '0');
                const qualityB = parseInt(b.quality?.replace('kbps', '') || '0');
                return qualityB - qualityA;
              });
              uri = sortedUrls[0]?.url || '';
            }
            
            // Fallback to other possible URL fields
            if (!uri) {
              uri = songData?.media_url || songData?.media_preview_url || songData?.perma_url || songData?.url || '';
            }
            
            if (!uri) {
              Alert.alert('Playback error', 'Unable to retrieve playable URL for this track.');
              return;
            }
            const track = {
              id: songData?.id || item.id,
              title: decodeHtmlEntities(songData?.title || songData?.name || item.title || ''),
              artist: songData?.subtitle || songData?.artist || item.subtitle || item.artist || '',
              uri,
              artwork: pickImage(songData?.image || songData?.images || item.image)
            } as Track;
            await playSong(track);
            open(track);
          } catch (e) {
            console.error('Failed to fetch or play song', e);
            Alert.alert('Playback error', 'Failed to play track.');
          }
          return;
        }

        if (type === 'playlist') {
          (nav as any).navigate('Playlist', { playlist: item });
          return;
        }

        if (type === 'artist') {
          (nav as any).navigate('Artist', { artist: item });
          return;
        }

        console.log('Unknown item type:', type, item);
      } catch (err) {
        console.error('[Home] handleItemPress error', err);
      }
    })();
  }, [playSong, nav]);

  const handleItemLongPress = useCallback((item: any) => {
    // Show context menu
    Alert.alert(
      item.title || item.name || 'Options',
      'Choose an action',
      [
        { text: 'Play', onPress: () => handleItemPress(item, item.type) },
        { text: 'Add to Queue', onPress: () => Alert.alert('Queue', 'Added to queue') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }, [handleItemPress]);

  const handleSeeAllPress = useCallback((sectionType: string) => {
    // Navigate to full list screen
    const sectionData = getSectionData(sectionType);
    const sectionTitle = getSectionTitle(sectionType);
    // For playlist-like sections, open playlist results screen
    if (sectionType === 'trending_playlists' || sectionType === 'top_charts') {
      (nav as any).navigate('PlaylistResults', { title: sectionTitle, data: sectionData });
      return;
    }
    (nav as any).navigate('SectionList', {
      type: sectionType,
      title: sectionTitle,
      data: sectionData
    });
  }, [nav]);

  const getSectionTitle = (type: string) => {
    switch (type) {
      case 'new_albums': return 'New Albums';
      case 'trending_songs': return 'Trending Songs';
      case 'top_charts': return 'Top Charts';
      case 'trending_playlists': return 'Trending Playlists';
      case 'recommended_artists': return 'Recommended Artists';
      default: return 'Section';
    }
  };

  const getSectionData = (type: string) => {
    switch (type) {
      case 'new_albums': return newAlbums;
      case 'trending_songs': return trendingSongs;
      case 'top_charts': return topCharts;
      case 'trending_playlists': return trendingPlaylists;
      case 'recommended_artists': return recommendedArtists;
      default: return [];
    }
  };

  const renderAlbum = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleItemPress(item, 'album')}
      onLongPress={() => handleItemLongPress(item)}
      accessibilityLabel={`Album: ${item.title} by ${item.artist}`}
      accessibilityRole="button"
    >
      <Card style={{ width: 140, marginRight: 12 }}>
        <Card.Cover 
          source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
          style={styles.albumImage} 
        />
        <Card.Content>
          <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
          {item.artist ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.artist}</Subheading> : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderSong = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleItemPress(item, 'song')}
      onLongPress={() => handleItemLongPress(item)}
      accessibilityLabel={`Song: ${item.title} by ${item.subtitle}`}
      accessibilityRole="button"
    >
      <Card style={{ width: 140, marginRight: 12 }}>
        <Card.Cover 
          source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
          style={styles.albumImage} 
        />
        <Card.Content>
          <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
          {item.subtitle ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.subtitle}</Subheading> : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderPlaylist = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleItemPress(item, 'playlist')}
      onLongPress={() => handleItemLongPress(item)}
      accessibilityLabel={`Playlist: ${item.title}`}
      accessibilityRole="button"
    >
      <Card style={{ width: 140, marginRight: 12 }}>
        <Card.Cover 
          source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
          style={styles.albumImage} 
        />
        <Card.Content>
          <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
          {item.subtitle ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.subtitle}</Subheading> : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderArtist = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleItemPress(item, 'artist')}
      onLongPress={() => handleItemLongPress(item)}
      accessibilityLabel={`Artist: ${item.name}`}
      accessibilityRole="button"
      style={{ width: 110, marginRight: 12, alignItems: 'center' }}
    >
      <Avatar.Image 
        source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
        size={110} 
        style={{ backgroundColor: '#ddd', marginBottom: 6 }} 
      />
      <Subheading numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
        {item.name}
      </Subheading>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, sectionType: string, showSeeAll: boolean = true) => (
    <View style={styles.sectionHeaderRow}>
      <Title style={styles.sectionTitle}>{title}</Title>
      {showSeeAll && (
        <TouchableOpacity 
          onPress={() => handleSeeAllPress(sectionType)}
          accessibilityLabel={`See all ${title.toLowerCase()}`}
          accessibilityRole="button"
          style={styles.seeAllButton}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <MaterialIcons name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <View style={{ padding: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ marginBottom: 24 }}>
          <View style={[styles.sectionHeaderRow, { marginBottom: 12 }]}>
            <View style={[styles.skeletonText, { width: 120, height: 24 }]} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            {[1, 2, 3].map((j) => (
              <View key={j} style={[styles.skeletonCard, { marginRight: 12 }]} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) return <LoadingSkeleton />;

  const noData = !newAlbums.length && !trendingSongs.length && !topCharts.length && !trendingPlaylists.length && !recommendedArtists.length;
  if (noData) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>No data available. Check your network or try reloading the app.</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={[{ key: 'content' }]}
        keyExtractor={i => i.key}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={() => (
          <View style={{ padding: 16 }}>
            {/* New Albums Section */}
            {newAlbums.length > 0 && (
              <>
                {renderSectionHeader('New Albums', 'new_albums')}
                <HorizontalScroller>
                  {newAlbums.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item, item.type)}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Album: ${item.title} by ${item.artist}`}
                      accessibilityRole="button"
                    >
                      <Card style={{ width: 140 }}>
                        <Card.Cover 
                          source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content>
                          <Title numberOfLines={2} style={styles.albumTitle}>{item.title}</Title>
                          {item.artist ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.artist}</Subheading> : null}
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </HorizontalScroller>
              </>
            )}

            {/* Trending Songs Section */}
            {trendingSongs.length > 0 && (
              <>
                {renderSectionHeader('Trending Songs', 'trending_songs')}
                <HorizontalScroller>
                  {trendingSongs.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item, 'song')}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Song: ${item.title} by ${item.subtitle}`}
                      accessibilityRole="button"
                    >
                      <Card style={{ width: 140 }}>
                        <Card.Cover 
                          source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content>
                          <Title numberOfLines={2} style={styles.albumTitle}>{item.title}</Title>
                          {item.subtitle ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.subtitle}</Subheading> : null}
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </HorizontalScroller>
              </>
            )}

            {/* Top Charts Section */}
            {topCharts.length > 0 && (
              <>
                {renderSectionHeader('Top Charts', 'top_charts')}
                <HorizontalScroller>
                  {topCharts.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item, 'playlist')}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Chart: ${item.title}`}
                      accessibilityRole="button"
                    >
                      <Card style={{ width: 140 }}>
                        <Card.Cover 
                          source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content>
                          <Title numberOfLines={2} style={styles.albumTitle}>{item.title}</Title>
                          {item.subtitle ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.subtitle}</Subheading> : null}
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </HorizontalScroller>
              </>
            )}

            {/* Trending Playlists Section */}
            {trendingPlaylists.length > 0 && (
              <>
                {renderSectionHeader('Trending Playlists', 'trending_playlists')}
                <HorizontalScroller>
                  {trendingPlaylists.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item, 'playlist')}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Playlist: ${item.title}`}
                      accessibilityRole="button"
                    >
                      <Card style={{ width: 140 }}>
                        <Card.Cover 
                          source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content>
                          <Title numberOfLines={2} style={styles.albumTitle}>{item.title}</Title>
                          {item.subtitle ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.subtitle}</Subheading> : null}
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </HorizontalScroller>
              </>
            )}

            {/* Recommended Artists Section */}
            {recommendedArtists.length > 0 && (
              <>
                {renderSectionHeader('Recommended Artists', 'recommended_artists')}
                <HorizontalScroller>
                  {recommendedArtists.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item, 'artist')}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Artist: ${item.name}`}
                      accessibilityRole="button"
                      style={{ width: 110, alignItems: 'center' }}
                    >
                      <Avatar.Image 
                        source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } 
                        size={110} 
                        style={{ backgroundColor: '#ddd', marginBottom: 6 }} 
                      />
                      <Subheading numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                        {item.name}
                      </Subheading>
                    </TouchableOpacity>
                  ))}
                </HorizontalScroller>
              </>
            )}
          </View>
        )}
      />
      
      {/* Mini Player */}
      {currentSong && (
        <MiniPlayer
          isPlaying={isPlaying}
          onPlayPause={() => isPlaying ? pauseSong() : playSong(currentSong)}
          onNext={nextSong}
          onPrevious={previousSong}
          onOpenFullPlayer={() => currentSong && open(currentSong)}
          currentSong={{
            title: currentSong.title || 'Unknown',
            artist: currentSong.artist || 'Unknown Artist',
            cover: currentSong.artwork || require('../../assets/soniq-logo.png')
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  albumImage: { width: 140, height: 140, borderRadius: 6, backgroundColor: '#ddd' },
  albumTitle: { marginTop: 6, fontSize: 13, fontWeight: '600' },
  albumArtist: { marginTop: 2, fontSize: 11, color: '#666' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAllButton: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontSize: 14, color: '#666', marginRight: 4 },
  chartRow: { flexDirection: 'row', alignItems: 'center' },
  chartImage: { width: 56, height: 56, borderRadius: 4, backgroundColor: '#ddd' },
  skeletonCard: { width: 140, height: 180, backgroundColor: '#e0e0e0', borderRadius: 6 },
  skeletonText: { backgroundColor: '#e0e0e0', borderRadius: 4 }
});

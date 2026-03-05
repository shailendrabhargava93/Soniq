import { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, Image } from "react-native";
import { Text, Title, Subheading, Card, Avatar, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import HorizontalScroller from '../components/HorizontalScroller';
import SkeletonLoader from '../components/SkeletonLoader';
import Svg, { Text as SvgText } from 'react-native-svg';
import { usePlayer } from '../contexts/PlayerContext';
import { saavnApi } from '../services/saavnApi';
import { useTopSongs } from '../hooks/useTopSongs';
import { getMeta } from '../services/storageCompat';
import { decodeHtmlEntities, getBestImage, getPlayableUrl } from '../utils/normalize';
import type { Track } from '../types/api';

const HOME_CARD_SIZE = 150;

const pickImage = (img: any) => getBestImage(img);

const getText = (field: any): string => {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object') {
    return field.text || field.title || field.name || '';
  }
  return '';
};

const extractIdFromUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  try {
    const cleaned = url.split('?')[0];
    const segments = cleaned.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last || undefined;
  } catch {
    return undefined;
  }
};

const resolveAlbumId = (item: any): string | undefined => {
  return (
    item?.albumId ||
    item?.albumid ||
    item?.id ||
    item?.album_id ||
    extractIdFromUrl(item?.perma_url) ||
    extractIdFromUrl(item?.url)
  );
};

const resolvePlaylistId = (item: any): string | undefined => {
  return (
    item?.playlistId ||
    item?.playlistid ||
    item?.listid ||
    item?.listId ||
    item?.id ||
    item?.pid ||
    extractIdFromUrl(item?.perma_url) ||
    extractIdFromUrl(item?.url)
  );
};

const resolveArtistId = (item: any): string | undefined => {
  return (
    item?.artistId ||
    item?.artistid ||
    item?.id ||
    item?.pid ||
    extractIdFromUrl(item?.perma_url) ||
    extractIdFromUrl(item?.url)
  );
};

const resolveSongId = (item: any): string | undefined => {
  return item?.songId || item?.songid || item?.id || item?.sid;
};

const extractArtistLabel = (source: any): string => {
  if (!source) return '';
  if (typeof source === 'string') return decodeHtmlEntities(source);
  if (Array.isArray(source)) {
    const names = source
      .map((entry: any) => {
        if (!entry) return '';
        if (typeof entry === 'string') return decodeHtmlEntities(entry);
        if (typeof entry === 'object') {
          const name = getText(entry.name) || getText(entry.title) || getText(entry.text) || getText(entry.primary);
          return name ? decodeHtmlEntities(name) : '';
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
    if (Array.isArray(source.featured)) return extractArtistLabel(source.featured);
    if (Array.isArray(source.more)) return extractArtistLabel(source.more);
    if (Array.isArray(source.singers)) return extractArtistLabel(source.singers);
    if (source.artist) return extractArtistLabel(source.artist);
    const name = getText(source.name) || getText(source.title) || getText(source.text);
    return name ? decodeHtmlEntities(name) : '';
  }
  return '';
};

const mapAlbumItem = (album: any) => {
  const albumId = resolveAlbumId(album);
  const artistLabel =
    extractArtistLabel(album.primaryArtists) ||
    extractArtistLabel(album.artists) ||
    decodeHtmlEntities(getText(album.subtitle) || getText(album.artist) || '');
  const title = decodeHtmlEntities(getText(album.title) || getText(album.name) || '');
  const displayArtist = artistLabel || 'Various Artists';
  return {
    id: albumId || album.id || extractIdFromUrl(album?.perma_url) || `${title}:${albumId ?? Math.random()}`,
    albumId,
    title,
    artist: displayArtist,
    subtitle: displayArtist,
    image: pickImage(album.image || album.images || album.thumbnail),
    type: album.type || 'album',
    perma_url: album.perma_url,
  };
};

const mapSongItem = (song: any) => {
  const songId = resolveSongId(song);
  const artistLabel =
    extractArtistLabel(song.primaryArtists) ||
    extractArtistLabel(song.artists) ||
    extractArtistLabel(song.singers) ||
    extractArtistLabel(song.more) ||
    decodeHtmlEntities(getText(song.subtitle) || getText(song.artist) || '');
  const title = decodeHtmlEntities(getText(song.title) || getText(song.name) || getText(song.song) || '');
  return {
    id: songId || extractIdFromUrl(song?.perma_url) || `${title}:${songId ?? Math.random()}`,
    songId,
    title,
    subtitle: artistLabel,
    artist: artistLabel,
    image: pickImage(song.image || song.images || song.thumbnail),
    type: song.type || 'song',
    perma_url: song.perma_url,
  };
};

const mapPlaylistItem = (playlist: any) => {
  const playlistId = resolvePlaylistId(playlist);
  const title = decodeHtmlEntities(getText(playlist.title) || getText(playlist.name) || '');
  const songCount = playlist.song_count ?? playlist.songCount ?? playlist.list_count;
  const subtitle = decodeHtmlEntities(
    getText(playlist.subtitle) ||
    getText(playlist.description) ||
    (songCount ? `${songCount} songs` : '')
  );
  return {
    id: playlistId || playlist.id || extractIdFromUrl(playlist?.perma_url) || `${title}:${playlistId ?? Math.random()}`,
    playlistId,
    title,
    subtitle,
    image: pickImage(playlist.image || playlist.images || playlist.thumbnail),
    type: playlist.type || 'playlist',
    perma_url: playlist.perma_url,
  };
};

const mapArtistItem = (artist: any) => {
  const artistId = resolveArtistId(artist);
  const name = decodeHtmlEntities(getText(artist.name) || getText(artist.title) || '');
  return {
    id: artistId || artist.id || `${name || Math.random()}`,
    artistId,
    name,
    title: name,
    image: pickImage(artist.image || artist.images || artist.thumbnail),
    type: artist.type || 'artist',
    perma_url: artist.perma_url,
  };
};

// Type-aware mapper: routes each item to the correct mapper based on its API type
const mapItemByType = (entry: any, fallbackType: string) => {
  const rawType = (entry.type || entry.item_type || fallbackType || '').toLowerCase();
  if (rawType.includes('playlist') || rawType.includes('chart')) return mapPlaylistItem(entry);
  if (rawType.includes('album')) return mapAlbumItem(entry);
  if (rawType.includes('artist') || rawType.includes('radio_station')) return mapArtistItem(entry);
  if (rawType.includes('song')) return mapSongItem(entry);
  // Fallback: detect by presence of type-specific ID fields
  if (entry.listid || entry.playlistId) return mapPlaylistItem(entry);
  if (entry.albumid || entry.albumId) return mapAlbumItem(entry);
  if (entry.artistid || entry.artistId) return mapArtistItem(entry);
  if (entry.songId || entry.songid) return mapSongItem(entry);
  // Final fallback based on calling context
  if (fallbackType === 'album') return mapAlbumItem(entry);
  if (fallbackType === 'song') return mapSongItem(entry);
  if (fallbackType === 'playlist') return mapPlaylistItem(entry);
  if (fallbackType === 'artist') return mapArtistItem(entry);
  return mapSongItem(entry);
};

const mapAlbumList = (list: any[]) => (Array.isArray(list) ? list.slice(0, 10).map((item) => mapItemByType(item, 'album')) : []);
const mapSongList = (list: any[]) => (Array.isArray(list) ? list.slice(0, 10).map((item) => mapItemByType(item, 'song')) : []);
const mapPlaylistList = (list: any[]) => (Array.isArray(list) ? list.slice(0, 10).map((item) => mapItemByType(item, 'playlist')) : []);
const mapArtistList = (list: any[]) => (Array.isArray(list) ? list.map((item) => mapItemByType(item, 'artist')) : []);

const mapPromoList = (items: any[]) => {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 10).map((entry: any) => {
    const mapped = mapItemByType(entry, 'song');
    return { ...mapped, type: 'song' };
  });
};

export default function Home() {
  const nav = useNavigation<any>();
  const theme = useTheme();
  const { playSong, open, recentlyPlayed } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [topCharts, setTopCharts] = useState<any[]>([]);
  const [trendingPlaylists, setTrendingPlaylists] = useState<any[]>([]);
  const [recommendedArtists, setRecommendedArtists] = useState<any[]>([]);
  const [promo68Title, setPromo68Title] = useState<string | null>(null);
  const [promo68Items, setPromo68Items] = useState<any[]>([]);
  const [promo185Title, setPromo185Title] = useState<string | null>(null);
  const [promo185Items, setPromo185Items] = useState<any[]>([]);
  const {
    items: topSongsIndia,
    allItems: topSongsIndiaAll,
    loading: topSongsIndiaLoading,
    error: topSongsIndiaError,
    refresh: refreshTopSongsIndia,
  } = useTopSongs(10);

  const extractPromoModule = (payload: any, key: string) => {
    if (!payload) return { title: null, items: [] };
    const data = payload?.data || payload;
    let title = null;
    let items = [];
    // Get title from modules[key] or modules array
    if (data?.modules) {
      if (typeof data.modules === 'object' && !Array.isArray(data.modules)) {
        // modules is an object, like modules['promo:vx:data:68']
        title = data.modules[key]?.title || null;
      } else if (Array.isArray(data.modules)) {
        // modules is array
        const m = data.modules.find((mm: any) => mm?.source === key);
        if (m) {
          title = m.title;
        }
      }
    }
    // Get items from data[key], same as new_albums
    if (Array.isArray(data[key])) {
      items = data[key];
    }
    return { title, items };
  };

  // Maps launch API response to section state
  // Data structure documented in docs/home_screen_api.json and docs/home_section_fixtures.json
  const applyLaunchData = (payload: any) => {
    const data = payload?.data || payload;
    if (!data) return;

    // Section: New Albums (from launch().data.new_albums)
    setNewAlbums(mapAlbumList(data?.new_albums || data?.newAlbums));
    
    // Section: Trending Songs (from launch().data.new_trending)
    setTrendingSongs(mapSongList(data?.new_trending || data?.newTrending));
    
    // Section: Top Charts (from launch().data.charts)
    setTopCharts(mapPlaylistList(data?.charts));
    
    // Section: Trending Playlists (from launch().data.top_playlists)
    setTrendingPlaylists(mapPlaylistList(data?.top_playlists || data?.topPlaylists));
    
    // Section: Recommended Artists (from launch().data.artist_recos)
    setRecommendedArtists(mapArtistList(data?.artist_recos || data?.artistRecos));

    const promo68 = extractPromoModule(payload, 'promo:vx:data:68');
    setPromo68Title(promo68.title);
    setPromo68Items(mapPromoList(promo68.items));

    const promo185 = extractPromoModule(payload, 'promo:vx:data:185');
    setPromo185Title(promo185.title);
    setPromo185Items(mapPromoList(promo185.items));
  };

  useEffect(() => {
    let mounted = true;
    const loadCachedLaunch = async () => {
      try {
        const cached = await getMeta('launch');
        if (cached) {
          applyLaunchData(cached);
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
          const payload = (await saavnApi.launch()) as any;
          if (!mounted) return;
          if (payload) {
            applyLaunchData(payload);
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
      await Promise.allSettled([
        (async () => {
          const payload = await saavnApi.launch();
          if (payload) {
            applyLaunchData(payload);
          }
        })(),
        refreshTopSongsIndia(),
      ]);
    } catch (error) {
      console.error('[Home] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshTopSongsIndia]);

  // Navigation handlers
  const handleItemPress = useCallback((item: any, type: string, context?: { section?: string; allItems?: any[] }) => {
    // Navigate to appropriate screen based on type
    (async () => {
      try {
        if (type === 'album') {
          const albumId = resolveAlbumId(item);
          if (!albumId) {
            Alert.alert('Unavailable', 'Missing album identifier. Please try another item.');
            return;
          }
          const albumPayload = { ...item, id: albumId, albumId };
          (nav as any).navigate('Album', { album: albumPayload });
          return;
        }

        if (type === 'song') {
          // Keep playlist-style open behavior for list sections, but play directly for Top Songs In India.
          if (context?.section && context?.allItems && context.section !== 'top_songs_india') {
            const sectionTitles: { [key: string]: string } = {
              'trending_songs': 'Trending Songs',
              'top_songs_india': 'Top Songs In India',
              'promo_68': promo68Title || 'Featured',
              'promo_185': promo185Title || 'Featured',
            };
            const playlistTitle = sectionTitles[context.section] || 'Songs';
            const resolveSongImage = (s: any) =>
              pickImage(s?.image || s?.artwork || s?.saavnData?.image || s?.images || s?.thumbnail);
            const coverImages = context.allItems
              .map((s: any) => resolveSongImage(s))
              .filter((u: any) => typeof u === 'string' && u.trim().length > 0)
              .slice(0, 4);
            const playlistPayload = {
              id: `section-${context.section}`,
              name: playlistTitle,
              title: playlistTitle,
              image: coverImages[0] || resolveSongImage(item),
              coverImages,
              songs: context.allItems.map((s: any) => ({
                id: s.id || s.songId || s.songid,
                title: s.title,
                subtitle: s.subtitle || s.artist,
                artist: s.subtitle || s.artist,
                image: resolveSongImage(s),
                artwork: resolveSongImage(s),
                uri: '',
              })),
            };
            (nav as any).navigate('Playlist', { playlist: playlistPayload });
            return;
          }

          // Otherwise play single song
          try {
            const parseSongPayload = (resp: any) =>
              (resp as any)?.data?.[0] || (resp as any)?.data?.songs?.[0] || (resp as any)?.data || resp;

            let resolvedSongId = resolveSongId(item);
            let songData: any = null;

            // First try direct song lookup if the source item already has a Saavn song id.
            if (resolvedSongId) {
              try {
                const resp = await saavnApi.getSongById(resolvedSongId);
                songData = parseSongPayload(resp);
              } catch {
                // SoundCharts ids are not Saavn ids; fallback search below.
              }
            }

            // Fallback for SoundCharts rows: resolve via Saavn search using title + artist.
            if (!songData) {
              const query = [item?.title, item?.subtitle || item?.artist].filter(Boolean).join(' ').trim();
              if (!query) {
                Alert.alert('Playback error', 'Missing song details for lookup.');
                return;
              }
              const searchResp: any = await saavnApi.searchSongs(query, 8);
              const candidates =
                searchResp?.data?.results ||
                searchResp?.results ||
                searchResp?.data ||
                [];
              const list = Array.isArray(candidates) ? candidates : [];
              const bestMatch = list.find((cand: any) => resolveSongId(cand)) || list[0];
              if (!bestMatch) {
                Alert.alert('Playback error', 'Unable to find this track in catalog.');
                return;
              }
              resolvedSongId = resolveSongId(bestMatch) || resolvedSongId;
              if (resolvedSongId) {
                const resp = await saavnApi.getSongById(String(resolvedSongId));
                songData = parseSongPayload(resp);
              } else {
                songData = bestMatch;
              }
            }

            let uri = getPlayableUrl(songData) || '';
            if (!uri) {
              Alert.alert('Playback error', 'Unable to retrieve playable URL for this track.');
              return;
            }
            const track = {
              id: songData?.id || resolvedSongId || item?.id,
              title: decodeHtmlEntities(songData?.title || songData?.name || item.title || ''),
              artist: decodeHtmlEntities(songData?.subtitle || songData?.artist || item.subtitle || item.artist || ''),
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
          const playlistId = resolvePlaylistId(item);
          if (!playlistId) {
            Alert.alert('Unavailable', 'Missing playlist identifier. Please try another item.');
            return;
          }
          const playlistPayload = { ...item, id: playlistId, playlistId };
          (nav as any).navigate('Playlist', { playlist: playlistPayload });
          return;
        }

        if (type === 'artist') {
          const artistId = resolveArtistId(item);
          if (!artistId) {
            Alert.alert('Unavailable', 'Missing artist identifier.');
            return;
          }
          try {
            const resp: any = await saavnApi.getArtistById(String(artistId));
            const data = resp?.data || resp || {};
            const artistDetails = {
              id: String(artistId),
              name: decodeHtmlEntities(getText(data.name) || getText(data.title) || getText(item.name) || getText(item.title) || ''),
              image: pickImage(data.image || data.images || item.image),
              bio: getText(data.bio) || getText(data.subtitle) || '',
              followers: data.follower_count || data.fan_count || data.followers || data.fans,
              isVerified: data.isVerified || data.is_verified || false,
              language: getText(data.dominantLanguage) || getText(data.language) || '',
            };
            (nav as any).navigate('Artist', { id: String(artistId), artist: artistDetails });
          } catch (e) {
            console.warn('Failed to fetch artist details, navigating with basic data', e);
            (nav as any).navigate('Artist', { id: String(artistId), artist: { ...item, id: String(artistId) } });
          }
          return;
        }

        if (type === 'radio_station') {
          const artistId = resolveArtistId(item);
          if (!artistId) {
            Alert.alert('Unavailable', 'Missing identifier for this station.');
            return;
          }
          try {
            const resp: any = await saavnApi.getArtistById(String(artistId));
            const data = resp?.data || resp || {};
            const artistDetails = {
              id: String(artistId),
              name: decodeHtmlEntities(getText(data.name) || getText(data.title) || getText(item.name) || getText(item.title) || ''),
              image: pickImage(data.image || data.images || item.image),
              bio: getText(data.bio) || getText(data.subtitle) || '',
              followers: data.follower_count || data.fan_count || data.followers || data.fans,
              isVerified: data.isVerified || data.is_verified || false,
              language: getText(data.dominantLanguage) || getText(data.language) || '',
            };
            (nav as any).navigate('Artist', { id: String(artistId), artist: artistDetails });
          } catch (e) {
            console.warn('Failed to fetch radio_station artist details', e);
            (nav as any).navigate('Artist', { id: String(artistId), artist: { ...item, id: String(artistId) } });
          }
          return;
        }

        console.log('Unknown item type:', type, item);
      } catch (err) {
        console.error('[Home] handleItemPress error', err);
      }
    })();
  }, [playSong, nav, open, promo68Title, promo185Title]);

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
    (async () => {
      // Navigate to full list screen
      const sectionTitle = getSectionTitle(sectionType);

      if (sectionType === 'recently_played') {
        (nav as any).navigate('RecentlyPlayed');
        return;
      }

      if (sectionType === 'top_songs_india') {
        const cached = await getMeta('chartSongs');
        const sectionData = Array.isArray(cached) && cached.length > 0 ? cached : topSongsIndiaAll;
        (nav as any).navigate('SectionList', {
          type: sectionType,
          title: sectionTitle,
          data: sectionData,
        });
        return;
      }

      const sectionData = getSectionData(sectionType);
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
    })().catch((err) => {
      console.error('[Home] handleSeeAllPress failed:', err);
    });
  }, [nav, topSongsIndiaAll]);

  const getSectionTitle = (type: string) => {
    switch (type) {
      case 'new_albums': return 'New Albums';
      case 'trending_songs': return 'Trending Songs';
      case 'top_songs_india': return 'Top Songs In India';
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
      case 'top_songs_india': return topSongsIndia;
      case 'top_charts': return topCharts;
      case 'trending_playlists': return trendingPlaylists;
      case 'recommended_artists': return recommendedArtists;
      default: return [];
    }
  };

  const renderSectionHeader = useCallback((title: string, sectionType: string, showSeeAll: boolean = false) => (
    <View style={styles.sectionHeaderRow}>
      <Title style={styles.sectionTitle}>{title}</Title>
      {showSeeAll && (
        <TouchableOpacity 
          onPress={() => handleSeeAllPress(sectionType)}
          accessibilityLabel={`Open ${title.toLowerCase()}`}
          accessibilityRole="button"
          style={styles.seeAllButton}
        >
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  ), [handleSeeAllPress, theme.colors.primary]);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SkeletonLoader type="home" />
    </View>
  );

  const noData =
    !newAlbums.length &&
    !trendingSongs.length &&
    !topCharts.length &&
    !trendingPlaylists.length &&
    !recommendedArtists.length &&
    !promo68Items.length &&
    !promo185Items.length &&
    !recentlyPlayed.length &&
    !topSongsIndia.length &&
    !topSongsIndiaLoading;
  if (noData) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>No data available. Check your network or try reloading the app.</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
        <Header 
          title="Home" 
          logo 
          onSettingsClick={() => nav.navigate('Settings')} 
          hideThemeToggle
        />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
          <View style={styles.content}>
            {/* Recently Played Section */}
            {recentlyPlayed.length > 0 && (
              <>
                {renderSectionHeader('Recently Played', 'recently_played', true)}
                <HorizontalScroller>
                  {recentlyPlayed.slice(0, 10).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item as any, 'song')}
                      onLongPress={() => handleItemLongPress(item as any)}
                      accessibilityLabel={`Song: ${item.title} by ${item.artist}`}
                      accessibilityRole="button"
                    >
                      <Card style={[styles.mediaCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Cover 
                          source={ item.artwork || item.image ? { uri: item.artwork || item.image } : require('../../assets/icon.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content style={styles.mediaContent}>
                          <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </HorizontalScroller>
              </>
            )}

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
                      <Card style={[styles.mediaCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Cover 
                          source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content style={styles.mediaContent}>
                          <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
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
                      onPress={() => handleItemPress(item, item.type, { section: 'trending_songs', allItems: trendingSongs })}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Song: ${item.title} by ${item.subtitle}`}
                      accessibilityRole="button"
                    >
                      <Card style={[styles.mediaCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Cover 
                          source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content style={styles.mediaContent}>
                          <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </HorizontalScroller>
              </>
            )}

            {/* Top Songs In India Section */}
            {topSongsIndia.length > 0 && (
              <>
                {renderSectionHeader('Top Songs In India', 'top_songs_india', true)}
                <HorizontalScroller>
                  {topSongsIndia.map((item, index) => {
                    const rankLabel = String(item.position || index + 1);
                    const TOP_IMG = HOME_CARD_SIZE;
                    const isDouble = rankLabel.length > 1;
                    const NUM_W = isDouble ? 148 : 95;
                    const NUM_FONT = isDouble ? 132 : 145;
                    const OVERLAP = 28;
                    const numFill = theme.dark ? theme.colors.background : '#FFFFFF';
                    const numStroke = theme.dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.84)';
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleItemPress(item, item.type)}
                        onLongPress={() => handleItemLongPress(item)}
                        accessibilityLabel={`Song: ${item.title} by ${item.subtitle}`}
                        accessibilityRole="button"
                        style={{ marginRight: 6 }}
                      >
                        {/* Number + Card overlap row */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: TOP_IMG }}>
                          <Svg
                            width={NUM_W}
                            height={TOP_IMG}
                            viewBox={`0 0 ${NUM_W} ${TOP_IMG}`}
                            style={{ alignSelf: 'stretch' }}
                          >
                            <SvgText
                              x={NUM_W * 0.55}
                              y={TOP_IMG - 2}
                              textAnchor="middle"
                              fontSize={NUM_FONT}
                              fontWeight="900"
                              fill={numFill}
                              stroke={numStroke}
                              strokeWidth="6"
                              strokeLinejoin="round"
                            >
                              {rankLabel}
                            </SvgText>
                          </Svg>
                          <View
                            style={{
                              width: TOP_IMG,
                              height: TOP_IMG,
                              borderRadius: 10,
                              overflow: 'hidden',
                              marginLeft: -OVERLAP,
                              elevation: 5,
                              shadowColor: '#000',
                              shadowOffset: { width: -2, height: 2 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                            }}
                          >
                            <Image
                              source={item.image ? { uri: item.image } : require('../../assets/icon.png')}
                              style={{ width: TOP_IMG, height: TOP_IMG, borderRadius: 10 }}
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                        {/* Title/artist aligned under the card portion */}
                        <View style={{ marginLeft: NUM_W - OVERLAP, width: TOP_IMG }}>
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 12, fontWeight: '700', marginTop: 6, color: theme.colors.onSurface }}
                          >
                            {item.title}
                          </Text>
                          {item.subtitle ? (
                            <Text
                              numberOfLines={1}
                              style={{ fontSize: 11, marginTop: 2, color: theme.colors.outline }}
                            >
                              {item.subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </HorizontalScroller>
              </>
            )}
            {topSongsIndiaError && (
              <View style={{ marginBottom: 16 }}>
                {renderSectionHeader('Top Songs In India', 'top_songs_india')}
                <Text style={{ fontSize: 12, color: '#a33' }}>
                  Could not load SoundCharts top songs. Pull to refresh after restart.
                </Text>
              </View>
            )}

            {/* Top Charts Section */}
            {topCharts.length > 0 && (
              <>
                {renderSectionHeader('Top Charts', 'top_charts')}
                <HorizontalScroller>
                  {topCharts.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                    onPress={() => handleItemPress(item, item.type)}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Chart: ${item.title}`}
                      accessibilityRole="button"
                    >
                      <Card style={[styles.mediaCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Cover 
                          source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content style={styles.mediaContent}>
                          <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
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
                    onPress={() => handleItemPress(item, item.type)}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Playlist: ${item.title}`}
                      accessibilityRole="button"
                    >
                      <Card style={[styles.mediaCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Cover 
                          source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } 
                          style={styles.albumImage} 
                        />
                        <Card.Content style={styles.mediaContent}>
                          <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
                          {item.subtitle ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.subtitle}</Subheading> : null}
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </HorizontalScroller>
              </>
            )}


            {/* Promo Module 68 Section */}
              {promo68Items.length > 0 && (
                <>
                  {renderSectionHeader(promo68Title || 'Featured', 'promo_68', false)}
                  <HorizontalScroller>
                    {promo68Items.map((item: any) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleItemPress(item, item.type, { section: 'promo_68', allItems: promo68Items })}
                        onLongPress={() => handleItemLongPress(item)}
                        accessibilityLabel={item.title}
                        accessibilityRole="button"
                      >
                        <Card style={[styles.mediaCard, { backgroundColor: theme.colors.surface }]}>
                          <Card.Cover 
                            source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } 
                            style={styles.albumImage} 
                          />
                          <Card.Content style={styles.mediaContent}>
                            <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
                            {item.subtitle ? <Subheading numberOfLines={1} style={styles.albumArtist}>{item.subtitle}</Subheading> : null}
                          </Card.Content>
                        </Card>
                      </TouchableOpacity>
                    ))}
                  </HorizontalScroller>
                </>
              )}

              {/* Promo Module 185 Section */}
                {promo185Items.length > 0 && (
                  <>
                    {renderSectionHeader(promo185Title || 'Featured', 'promo_185', false)}
                    <HorizontalScroller>
                      {promo185Items.map((item: any) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => handleItemPress(item, item.type, { section: 'promo_185', allItems: promo185Items })}
                        onLongPress={() => handleItemLongPress(item)}
                        accessibilityLabel={item.title}
                        accessibilityRole="button"
                      >
                        <Card style={[styles.mediaCard, { backgroundColor: theme.colors.surface }]}>
                          <Card.Cover 
                            source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } 
                            style={styles.albumImage} 
                          />
                          <Card.Content style={styles.mediaContent}>
                            <Title numberOfLines={1} style={styles.albumTitle}>{item.title}</Title>
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
                      onPress={() => handleItemPress(item, item.type)}
                      onLongPress={() => handleItemLongPress(item)}
                      accessibilityLabel={`Artist: ${item.name}`}
                      accessibilityRole="button"
                      style={{ width: 110, alignItems: 'center' }}
                    >
                      <Avatar.Image 
                        source={ item.image ? { uri: item.image } : require('../../assets/icon.png') } 
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  content: {
    padding: 16,
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
  mediaCard: {
    width: HOME_CARD_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  mediaContent: {
    paddingHorizontal: 2,
    paddingTop: 8,
    paddingBottom: 2,
  },
  albumImage: { width: HOME_CARD_SIZE, height: HOME_CARD_SIZE, borderRadius: 8, backgroundColor: '#ddd' },
  albumTitle: { marginTop: 2, fontSize: 13, fontWeight: '700' },
  albumArtist: { marginTop: 0, fontSize: 11, color: '#666' },
   sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 0 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  seeAllButton: { flexDirection: 'row', alignItems: 'center' },
  chartRow: { flexDirection: 'row', alignItems: 'center' },
  chartImage: { width: 56, height: 56, borderRadius: 4, backgroundColor: '#ddd' },
  skeletonCard: { width: 140, height: 180, backgroundColor: '#e0e0e0', borderRadius: 6 },
  skeletonText: { backgroundColor: '#e0e0e0', borderRadius: 4 }
});

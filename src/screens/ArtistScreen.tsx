import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text, Card } from "react-native-paper";
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { saavnApi } from '../services/saavnApi';
import { getBestImage, decodeHtmlEntities, joinArtistNames } from '../utils/normalize';
import { usePlayer } from '../contexts/PlayerContext';
import { Track } from '../types/api';
import MediaRow from '../components/MediaRow';
import HorizontalScroller from '../components/HorizontalScroller';
import MusicCard from '../components/MusicCard';
import HeroLayout from '../components/HeroLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import { useFavorites } from '../contexts/FavoritesContext';

interface ArtistDetails {
  id?: string;
  name?: string;
  image?: string;
  bio?: string;
  followers?: number;
  fans?: number;
  isVerified?: boolean;
  language?: string;
}

interface ArtistScreenProps {
  route: any;
  navigation: any;
}

const getText = (field: any) => (typeof field === 'string' ? field : field?.text || '');

const normalizeArtistCollection = (input: any): any[] => {
  if (!input) return [];
  if (typeof input === 'string') return [input];
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.primary)) return input.primary;
  if (Array.isArray(input.primaryArtists)) return input.primaryArtists;
  if (typeof input.primaryArtists === 'string') return [input.primaryArtists];
  if (Array.isArray(input.all)) return input.all;
  if (Array.isArray(input.featured) && input.featured.length) return input.featured;
  if (input.artists) return normalizeArtistCollection(input.artists);
  if (input.artist) return normalizeArtistCollection(input.artist);
  return [];
};

const getArtistName = (artists: any) => {
  const normalized = normalizeArtistCollection(artists);
  if (normalized.length === 0) {
    if (typeof artists === 'string') return artists;
    if (artists?.name) return artists.name;
    return '';
  }
  if (typeof normalized[0] === 'string') return normalized.join(', ');
  return joinArtistNames(normalized);
};

const getFirstArtistId = (artists: any) => {
  const normalized = normalizeArtistCollection(artists);
  if (normalized.length > 0) {
    const first = normalized[0];
    if (first && typeof first === 'object') {
      return first.id || first.pid || first.artistid || first.id_str;
    }
  }
  if (artists && typeof artists === 'object') return artists.id;
  return undefined;
};

function formatNumber(n?: number | null) {
  if (!n && n !== 0) return '--';
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

const ArtistScreen = function({ route, navigation }: ArtistScreenProps) {
  const { id, artist } = route.params as { id?: string, artist: any };
  const { theme } = useTheme();
  const player = usePlayer();
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [singles, setSingles] = useState<any[]>([]);
  const [topAlbumsState, setTopAlbumsState] = useState<any[]>([]);
  const [details, setDetails] = useState<ArtistDetails | null>(artist || null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toggleArtistFavorite, isArtistFavorite } = useFavorites();
  const resolvedArtistId = details?.id || artist?.id || id;
  const isFavourite = resolvedArtistId ? isArtistFavorite(String(resolvedArtistId)) : false;

  const buildTrackFromSong = useCallback((song: any): Track => ({
    id: song.id,
    title: decodeHtmlEntities(getText(song.title) || getText(song.name) || ''),
    artist: decodeHtmlEntities(getArtistName(song.primaryArtists) || getText(song.subtitle) || ''),
    uri: song.downloadUrl?.[0]?.url || song.url || '',
    artwork: getBestImage(song.image),
  }), []);

  const fetchAlbumSongs = useCallback(async (albumId?: string) => {
    if (!albumId) return [];
    try {
      const albumData = await saavnApi.getAlbumById(String(albumId));
      return (albumData as any)?.data?.songs || (albumData as any)?.songs || [];
    } catch (error) {
      console.warn('Failed to fetch album songs', error);
      return [];
    }
  }, []);

  const resolveSong = useCallback(async (song: any): Promise<any> => {
    if (song.downloadUrl || song.url) return song;
    try {
      if (song.albumId) {
        const albumData = await saavnApi.getAlbumById(song.albumId);
        const albumSongs = (albumData as any)?.data?.songs || (albumData as any)?.songs || [];
        const resolved = albumSongs.find((s: any) => s.id === song.id);
        if (resolved) return { ...song, ...resolved };
      }
      const songData = await saavnApi.getSongById(song.id);
      return { ...song, ...(songData as any) };
    } catch (e) {
      console.warn('Failed to resolve song', song.id, e);
      return song;
    }
  }, []);

  const playSongResolved = useCallback(async (song: any) => {
    const resolved = await resolveSong(song);
    const track: Track = buildTrackFromSong(resolved);
    await player.playSong(track);
    player.open(track);
  }, [buildTrackFromSong, player, resolveSong]);

  const playTopSongsQueue = useCallback(async (startIndex: number) => {
    if (topSongs.length === 0) return;
    const resolvedSongs = await Promise.all(topSongs.map((song) => resolveSong(song.raw || song)));
    const queue = resolvedSongs
      .map((song) => buildTrackFromSong(song))
      .filter((song) => !!song.uri);

    if (queue.length === 0) return;
    const clamped = Math.max(0, Math.min(startIndex, queue.length - 1));
    await player.playQueue(queue as any, clamped);
    player.open(queue[clamped] as any);
  }, [buildTrackFromSong, player, resolveSong, topSongs]);

  const handleAlbumPress = useCallback(async (album: any) => {
    const albumId = album?.id || album?.albumid || album?.albumId || album?.sid;
    try {
      const songs = albumId ? await fetchAlbumSongs(albumId) : [];
      (navigation as any).navigate('Album', {
        album: { ...album, id: albumId || album?.id },
        songs,
      });
    } catch (e) {
      console.warn('Failed to fetch album', e);
      (navigation as any).navigate('Album', { album: { ...album, id: albumId || album?.id } });
    }
  }, [fetchAlbumSongs, navigation]);

  const toggleFavourite = useCallback(async () => {
    if (!resolvedArtistId) return;
    try {
      await toggleArtistFavorite({
        id: String(resolvedArtistId),
        name: getText(details?.name) || getText(artist?.name) || getText(artist?.title) || '',
        image: details?.image || artist?.image,
      });
    } catch (error) {
      console.warn('Failed to toggle favourite artist', error);
    }
  }, [artist?.image, artist?.name, artist?.title, details?.image, details?.name, resolvedArtistId, toggleArtistFavorite]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id && !artist) return;
      setLoading(true);
      try {
        let data: any = null;

        if (id) {
          // prefer artist-by-id endpoint
          try {
            const resp: any = await saavnApi.getArtistById(String(id));
            data = (resp as any)?.data || resp || {};
          } catch (e) {
            console.warn('Artist by id fetch failed, falling back to search', e);
            data = null;
          }
        }

        if (!data && artist?.name) {
          const resp: any = await saavnApi.search(artist.name || artist.title || '');
          data = (resp as any)?.data || resp || {};
        }

        // populate details
        const artistObj = data;
        const resolvedName = getText(artistObj?.name) || getText(artistObj?.title) || getText(artist?.name) || getText(artist?.title) || '';
        if (mounted) setDetails({
          id: artistObj?.id,
          name: resolvedName,
          image: getBestImage(artistObj?.image),
          bio: getText(artistObj?.bio) || getText(artist?.bio) || '',
          followers: artistObj?.followerCount || artistObj?.followers || artist?.followerCount,
          fans: artistObj?.fanCount || artistObj?.fans || artist?.fanCount,
          isVerified: artistObj?.isVerified || artist?.isVerified || false,
          language: artistObj?.dominantLanguage || artistObj?.language || '',
        });

        // Load favourite status
        // Albums / New releases / topAlbums - prefer normalized keys
        const topAlbumResults = data?.topAlbums || data?.albums || [];
        if (Array.isArray(topAlbumResults) && mounted) {
          const topAlbums = topAlbumResults.map((a: any, idx: number) => {
            const artistSource = a.primaryArtists || a.artists;
            const albumArtist = decodeHtmlEntities(
              getArtistName(artistSource) ||
              getArtistName(a.artists?.primary) ||
              getText(a.artist) ||
              getText(a.subtitle) ||
              resolvedName
            );
            const albumId = a.id || a.albumid || a.albumId || a.sid || `album-${idx}`;
            return {
              id: albumId,
              title: decodeHtmlEntities(getText(a.title) || getText(a.name) || ''),
              subtitle: albumArtist,
              artist: albumArtist,
              artistId: getFirstArtistId(artistSource || a.artists?.primary || a.artists?.all),
              image: getBestImage(a.image)
            };
          });
          setTopAlbumsState(topAlbums);
        }

        // Singles (sometimes present separately)
        const singlesResults = data?.singles || [];
        if (Array.isArray(singlesResults) && mounted) {
          const singles = singlesResults.map((a: any, idx: number) => {
            const artistSource = a.primaryArtists || a.artists;
            const artistLabel = decodeHtmlEntities(
              getArtistName(artistSource) ||
              getArtistName(a.artists?.primary) ||
              getText(a.artist) ||
              getText(a.subtitle) ||
              resolvedName
            );
            const image = getBestImage(a.image);
            const singleId = a.id || a.sid || a.songid || `single-${idx}`;
            return {
              id: singleId,
              title: decodeHtmlEntities(getText(a.title) || getText(a.name) || ''),
              subtitle: artistLabel,
              artist: artistLabel,
              artistId: getFirstArtistId(artistSource || a.artists?.primary || a.artists?.all),
              image,
              artwork: image,
            };
          });
          setSingles(singles);
        }

        // Top songs (try topSongs first then fallback)
        const songResults = data?.topSongs || data?.songs || [];
        if (Array.isArray(songResults) && mounted) {
          const songs = songResults.map((s: any, idx: number) => {
            const primary = s.primaryArtists || s.primaryArtist || s.artists?.primary || s.artists?.all || s.artists || [];
            const artistName = decodeHtmlEntities(
              getArtistName(primary) ||
              getText(s.subtitle) ||
              resolvedName
            );
            return {
              id: s.id || s.sid || String(idx),
              title: decodeHtmlEntities(getText(s.title) || getText(s.name) || getText(s.song) || ''),
              artist: artistName,
              artistId: getFirstArtistId(primary) || s.primaryArtistId || s.artistId || s.artists?.primary?.[0]?.id || s.artists?.all?.[0]?.id,
              artwork: getBestImage(s.image),
              raw: s,
            };
          });
          setTopSongs(songs);
        }
      } catch (e) {
        console.warn('Artist fetch failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, artist]);

  const handlePlayPress = useCallback(async () => {
    if (topSongs.length > 0) {
      await playTopSongsQueue(0);
    }
  }, [playTopSongsQueue, topSongs.length]);

  const handleShufflePress = useCallback(async () => {
    if (topSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * topSongs.length);
    await playTopSongsQueue(randomIndex);
  }, [playTopSongsQueue, topSongs]);

  const customHeroContent = useMemo(() => (
    <View style={styles.heroSection}>
      <View style={styles.centeredImageContainer}>
        <Card style={[styles.artistImageCard, { backgroundColor: theme.colors.surface }]}>
          <Image
            source={details?.image ? { uri: details.image } : require('../../assets/icon.png')}
            style={styles.artistImageLarge}
          />
        </Card>
      </View>

      {/* Artist Name & Verified Badge */}
      <View style={styles.artistNameRow}>
        <Text style={[styles.artistTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {getText(details?.name) || 'Artist'}
        </Text>
        {details?.isVerified ? (
          <MaterialIcons name="verified" size={22} color={theme.colors.primary} style={styles.verifiedIcon} />
        ) : null}
      </View>

      <View style={styles.statsRow}>
        {details?.followers ? (
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {formatNumber(details.followers)} followers
          </Text>
        ) : null}
        {details?.fans ? (
          <>
            <Text style={[styles.statDot, { color: theme.colors.onSurfaceVariant }]}>•</Text>
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {formatNumber(details.fans)} fans
            </Text>
          </>
        ) : null}
        {details?.language ? (
          <>
            <Text style={[styles.statDot, { color: theme.colors.onSurfaceVariant }]}>•</Text>
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {String(details.language).toUpperCase()}
            </Text>
          </>
        ) : null}
      </View>

      {details?.bio ? (
        <Text style={[styles.artistBio, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
          {details.bio}
        </Text>
      ) : null}
    </View>
  ), [details?.bio, details?.followers, details?.fans, details?.image, details?.isVerified, details?.language, details?.name, theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.primary, theme.colors.surface]);

  const flattenedData: any[] = useMemo(() => {
    const data: any[] = [];
    if (topSongs.length > 0) {
      data.push({ type: 'section_header', title: 'Top Songs', key: 'topSongs-header' });
      topSongs.forEach((song) => data.push({ ...song, type: 'song' }));
    }
    if (topAlbumsState.length > 0) {
      data.push({ type: 'section_header', title: 'Albums', key: 'albums-header' });
      data.push({ type: 'horizontal_albums', items: topAlbumsState, key: 'albums-list' });
    }
    if (singles.length > 0) {
      data.push({ type: 'section_header', title: 'Singles', key: 'singles-header' });
      data.push({ type: 'horizontal_singles', items: singles, key: 'singles-list' });
    }
    return data;
  }, [singles, topAlbumsState, topSongs]);

  const keyExtractor = useCallback((item: any, idx: number) => item.key || item.id || `item-${idx}`, []);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'section_header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {item.title}
          </Text>
        </View>
      );
    }
    
    if (item.type === 'horizontal_albums') {
      return (
        <View style={styles.horizontalSectionContainer}>
          <HorizontalScroller gap={8}>
            {item.items.map((album: any) => (
              <MusicCard key={album.id} item={album} type="albums" noShadow onPress={() => handleAlbumPress(album)} />
            ))}
          </HorizontalScroller>
        </View>
      );
    }
    
    if (item.type === 'horizontal_singles') {
      return (
        <View style={styles.horizontalSectionContainer}>
          <HorizontalScroller gap={8}>
            {item.items.map((single: any) => (
              <MusicCard key={single.id} item={single} type="songs" noShadow onPress={() => playSongResolved(single.raw || single)} />
            ))}
          </HorizontalScroller>
        </View>
      );
    }
    
    if (item.type === 'song') {
      return (
        <View style={styles.sectionRowWrapper}>
          <MediaRow
            item={{
              id: item.id,
              title: item.title,
              artist: item.artist,
              artwork: item.artwork,
            }}
            type="song"
            onPress={() => {
              const idx = topSongs.findIndex((song) => String(song.id) === String(item.id));
              if (idx >= 0) {
                void playTopSongsQueue(idx);
                return;
              }
              void playSongResolved(item.raw || item);
            }}
            onPlayNow={() => {
              const idx = topSongs.findIndex((song) => String(song.id) === String(item.id));
              if (idx >= 0) {
                void playTopSongsQueue(idx);
                return;
              }
              void playSongResolved(item.raw || item);
            }}
            onAddToQueue={async () => {
              const resolved = await resolveSong(item.raw || item);
              const track: Track = buildTrackFromSong(resolved);
              if (track.uri) player.addToQueue(track);
            }}
            onPlayNext={async () => {
              const resolved = await resolveSong(item.raw || item);
              const track: Track = buildTrackFromSong(resolved);
              if (track.uri) player.playNext(track);
            }}
          />
        </View>
      );
    }
    
    return null;
  }, [buildTrackFromSong, handleAlbumPress, playSongResolved, playTopSongsQueue, player, resolveSong, theme.colors.onSurface, topSongs]);

  if (loading && !details) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SkeletonLoader type="home" />
      </View>
    );
  }

  return (
    <HeroLayout
      coverImage={details?.image || artist?.image || null}
      title={getText(details?.name) || getText(artist?.name) || 'Artist'}
      subtitle=""
      circularCover={true}
      coverSize={160}
      customHeroContent={customHeroContent}
      isLiked={isFavourite}
      onLikePress={toggleFavourite}
      onPlayPress={handlePlayPress}
      onShufflePress={handleShufflePress}
      data={flattenedData}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 100 }}
      renderItem={renderItem}
    />
  );
};

const styles = StyleSheet.create({
  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  artistImageCard: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  artistImageLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  artistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  centeredImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  horizontalSectionContainer: {
    paddingHorizontal: 16,
  },
  artistTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 14,
  },
  statDot: {
    marginHorizontal: 8,
    fontSize: 14,
  },
  artistBio: {
    marginTop: 12,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  // Section styles  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionRowWrapper: {
    paddingHorizontal: 16,
  },
});

export default ArtistScreen;

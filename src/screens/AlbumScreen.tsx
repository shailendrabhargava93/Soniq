import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { saavnApi } from '../services/saavnApi';
import MediaRow from '../components/MediaRow';
import HeroLayout from '../components/HeroLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { decodeHtmlEntities, getBestImage, getPlayableUrl } from '../utils/normalize';
import { cacheGet, cacheSet } from '../services/cache';

interface AlbumScreenProps {}

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
          if (entry.primary) return decodeHtmlEntities(entry.primary);
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
    if (source.name) return decodeHtmlEntities(source.name);
    if (source.title) return decodeHtmlEntities(source.title);
    if (source.text) return decodeHtmlEntities(source.text);
  }
  return '';
};

const mapAlbumSongs = (songsArr: any[] = [], album: any = {}) => {
  const fallbackImage = getBestImage(album?.image || album?.images);
  const fallbackAlbumId = album?.id || album?.albumId || album?.sid;
  const fallbackAlbumTitle = decodeHtmlEntities(album?.title || album?.name || '');

  return songsArr.map((s: any, index: number) => {
    const artistLabel =
      extractArtistLabel(s.primaryArtists) ||
      extractArtistLabel(s.artists) ||
      extractArtistLabel(s.singers) ||
      extractArtistLabel(s.more) ||
      decodeHtmlEntities(s.subtitle || s.artist || '');

    const artwork = getBestImage(s.image || s.images || fallbackImage);
    const albumArtwork = getBestImage(s.album?.image || fallbackImage);

    return {
      id: s.id || s.sid || s.songid || `${fallbackAlbumId || 'track'}-${index}`,
      title: decodeHtmlEntities(s.title || s.name || ''),
      artist: artistLabel,
      uri: getPlayableUrl(s),
      artwork,
      image: artwork,
      albumId: s.albumid || s.albumId || fallbackAlbumId,
      album: decodeHtmlEntities(s.album || fallbackAlbumTitle),
      albumArtwork,
    };
  });
};

const AlbumScreen: React.FC<AlbumScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { album, songs: initialSongs } = route.params as { album: any; songs?: any[] };
  const [songs, setSongs] = useState<any[]>(() => (Array.isArray(initialSongs) && initialSongs.length ? mapAlbumSongs(initialSongs, album) : []));
  const [loading, setLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(25);
  const player = usePlayer();
  const { theme } = useTheme();
  const { toggleAlbumFavorite, isAlbumFavorite } = useFavorites();
  const albumId = album?.id || album?.albumId || album?.sid;
  const albumTitle = decodeHtmlEntities(album?.title || album?.name || '');
  const albumImage = getBestImage(album?.image || album?.images);
  const albumLiked = isAlbumFavorite(albumId);
  const currentSongId = player.currentSong?.id ? String(player.currentSong.id) : '';
  const isAlbumTrack = !!currentSongId && songs.some((s) => String(s.id) === currentSongId);
  const isAlbumPlaying = isAlbumTrack && player.isPlaying;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        
        // Validate album ID
        if (!albumId) {
          console.warn('AlbumScreen: No album ID provided', album);
          if (mounted) setLoading(false);
          return;
        }
        
        // try cache first
        const cacheKey = `album:${albumId}`;
        const cached = await cacheGet(cacheKey, 1000 * 60 * 60 * 24);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setSongs((prev) => (prev.length ? prev : cached));
        }

        const resp: any = await saavnApi.getAlbumById(albumId);
        const data = resp?.data || resp;
        const songsArr = Array.isArray(data?.data?.songs)
          ? data.data.songs
          : Array.isArray(data?.songs)
            ? data.songs
            : Array.isArray(data)
              ? data
              : [];
        const mapped = mapAlbumSongs(songsArr, album);
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

  const handlePlayPress = async () => {
    if (isAlbumTrack) {
      if (player.isPlaying) {
        await player.pauseSong();
      } else {
        await player.playSong(player.currentSong || undefined);
      }
      return;
    }

    if (songs.length === 0) return;
    const s = songs[0];
    if (!s.uri) {
      try {
        const resp: any = await saavnApi.getSongById(s.id);
        const songObj = (resp?.data?.[0]) || resp?.data || resp;
        s.uri = getPlayableUrl(songObj) || s.uri;
      } catch (e) { console.warn('playall fetch failed', e); }
    }
    if (!s.uri) return Alert.alert('Playback error', 'No playable URL');
    const queue = songs
      .filter((song) => !!song?.uri)
      .map((song) => ({ id: song.id, title: song.title, artist: song.artist, uri: song.uri, artwork: song.artwork }));
    await player.playQueue(queue as any, 0);
    player.open(queue[0] as any);
  };

  const handleShufflePress = async () => {
    if (songs.length === 0) return;

    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    const first = { ...shuffled[0] };
    if (!first.uri) {
      try {
        const resp: any = await saavnApi.getSongById(first.id);
        const songObj = (resp?.data?.[0]) || resp?.data || resp;
        first.uri = getPlayableUrl(songObj) || first.uri;
      } catch (e) { console.warn('shuffle fetch failed', e); }
    }
    if (!first.uri) return Alert.alert('Playback error', 'No playable URL');

    const shuffledQueue = shuffled
      .filter((song) => !!song?.uri)
      .map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        uri: song.uri,
        artwork: song.artwork || song.image,
      }));
    await player.playQueue(shuffledQueue as any, 0);
    player.open(shuffledQueue[0] as any);
  };

  const handleLikePress = () => {
    if (!albumId) return;
    toggleAlbumFavorite({
      id: albumId,
      title: albumTitle,
      image: albumImage,
      songs,
    });
  };

  const handleMorePress = () => {
    Alert.alert('More', 'More options for album');
  };

  const handleSongPress = async (item: any) => {
    if (!item.uri) {
      try {
        const resp: any = await saavnApi.getSongById(item.id);
        const songObj = (resp?.data?.[0]) || resp?.data || resp;
        item.uri = getPlayableUrl(songObj) || item.uri;
      } catch (e) { console.warn(e); }
    }
    if (!item.uri) return Alert.alert('Playback error', 'No playable URL');
    const selectedId = String(item.id);
    const queue = songs
      .filter((song) => !!song?.uri)
      .map((song) => ({
        id: String(song.id),
        title: song.title,
        artist: song.artist,
        uri: song.uri,
        artwork: song.artwork || song.image,
      }));
    const startIndex = Math.max(0, queue.findIndex((song) => song.id === selectedId));
    if (queue.length === 0) {
      await player.playSong({ id: item.id, title: item.title, artist: item.artist, uri: item.uri, artwork: item.artwork });
      player.open({ id: item.id, title: item.title, artist: item.artist, uri: item.uri, artwork: item.artwork });
      return;
    }
    await player.playQueue(queue as any, startIndex);
    player.open(queue[startIndex] as any);
  };

  if (loading && songs.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SkeletonLoader type="list" count={10} />
      </View>
    );
  }

  return (
    <HeroLayout
      coverImage={albumImage}
      title={albumTitle || 'Album'}
      subtitle={`${songs.length} songs`}
      isLiked={albumLiked}
      onLikePress={handleLikePress}
      onPlayPress={handlePlayPress}
      onShufflePress={handleShufflePress}
      isPlayActive={isAlbumPlaying}
      data={songs.slice(0, displayCount)}
      keyExtractor={(i: any) => String(i.id)}
      onEndReached={() => setDisplayCount((c) => Math.min(songs.length, c + 25))}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      renderItem={({ item, index }: { item: any; index: number }) => (
        <MediaRow
          item={item}
          type="song"
          onPress={() => handleSongPress(item)}
          onPlayNow={(s) => handleSongPress(s)}
          onAddToQueue={(s) => player.addToQueue(s)}
          onPlayNext={(s) => player.playNext(s)}
          onGoToAlbum={(s) => {
            if (!s.albumId || s.albumId === albumId) return;
            (navigation as any).navigate('Album', { 
              album: { 
                id: s.albumId, 
                albumId: s.albumId,
                title: s.album,
                name: s.album,
                image: s.albumArtwork || s.artwork || s.image
              } 
            });
          }}
          showDragHandle={false}
        />
      )}
    />
  );
};

export default AlbumScreen;

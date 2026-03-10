import React, { useState, useEffect } from 'react';
import { Alert, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import MediaRow from '../components/MediaRow';
import HeroLayout from '../components/HeroLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import { usePlayer } from '../contexts/PlayerContext';
import { saavnApi } from '../services/saavnApi';
import { getBestImage, decodeHtmlEntities, getPlayableUrl } from '../utils/normalize';
import { cacheGet, cacheSet } from '../services/cache';
import { useFavorites } from '../contexts/FavoritesContext';

interface PlaylistScreenProps {}

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
    if (Array.isArray(source.more)) return extractArtistLabel(source.more);
    if (Array.isArray(source.singers)) return extractArtistLabel(source.singers);
    if (source.artist) return extractArtistLabel(source.artist);
    if (source.name) return decodeHtmlEntities(source.name);
    if (source.title) return decodeHtmlEntities(source.title);
    if (source.text) return decodeHtmlEntities(source.text);
  }
  return '';
};

const PlaylistScreen: React.FC<PlaylistScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { playlist } = route.params as { playlist: any };
  const player = usePlayer();
  const [displayCount, setDisplayCount] = useState(25);
  const [songs, setSongs] = useState<any[]>(() => Array.isArray(playlist?.songs) ? playlist.songs.map((s: any) => {
    const artistLabel = extractArtistLabel(s.subtitle || s.artist || s.singers || s.more || s.artists) || 'Various Artists';
    const artwork = getBestImage(s.image || s.images || s.thumbnail || playlist?.image);
    const albumArtwork = getBestImage(s.album?.image || s.albumImage || s.image || s.images);
    return {
      id: s.id || s.sid || s.songid,
      title: decodeHtmlEntities(s.title || s.name || s.song || ''),
      artist: artistLabel,
      artwork,
      image: artwork,
      uri: s.uri || getPlayableUrl(s) || '',
      albumId: s.albumid || s.albumId || s.album?.id,
      album: decodeHtmlEntities(s.album?.name || s.album?.title || s.albumName || s.album || ''),
      albumArtwork,
    };
  }) : []);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const { togglePlaylistFavorite, isPlaylistFavorite } = useFavorites();
  const playlistId = playlist?.id || playlist?.pid || playlist?.playlistId || playlist?.sid;
  const playlistTitle = decodeHtmlEntities(playlist?.name || playlist?.title || '');
  const playlistImage = getBestImage(playlist?.image || playlist?.thumbnail);
  const baseCoverImages = (
    Array.isArray(playlist?.coverImages) && playlist.coverImages.length > 0
      ? playlist.coverImages
      : []
  )
    .filter((img: any) => typeof img === 'string' && img.trim().length > 0)
    .slice(0, 4);
  const playlistCoverImages = baseCoverImages.length > 0
    ? baseCoverImages
    : [];
  const playlistLiked = isPlaylistFavorite(playlistId);
  const currentSongId = player.currentSong?.id ? String(player.currentSong.id) : '';
  const isPlaylistTrack = !!currentSongId && songs.some((s) => String(s.id) === currentSongId);
  const isPlaylistPlaying = isPlaylistTrack && player.isPlaying;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (songs.length > 0) return; // already have songs
      setLoading(true);
      
      // Validate playlist ID
      if (!playlistId) {
        console.warn('PlaylistScreen: No playlist ID provided', playlist);
        if (mounted) setLoading(false);
        return;
      }
      
      const cacheKey = `playlist:${playlistId}`;
      try {
        const cached = await cacheGet(cacheKey, 1000 * 60 * 60 * 24);
        if (cached && mounted) {
          setSongs(cached);
        }
        const resp: any = await saavnApi.getPlaylistById(playlistId);
        const data = resp?.data || resp;
        const songsArr = Array.isArray(data?.data?.songs) ? data.data.songs : Array.isArray(data?.songs) ? data.songs : (Array.isArray(data) ? data : []);
        const mapped = songsArr.map((s: any) => {
          const artistLabel = extractArtistLabel(s.subtitle || s.artist || s.singers || s.more || s.artists) || 'Various Artists';
          const artwork = getBestImage(s.image || s.images || s.thumbnail || playlist?.image);
          const albumArtwork = getBestImage(s.album?.image || s.albumImage || s.image || s.images);
          return {
            id: s.id || s.sid || s.songid,
            title: decodeHtmlEntities(s.title || s.name || s.song || ''),
            artist: artistLabel,
            artwork,
            image: artwork,
            uri: getPlayableUrl(s) || '',
            albumId: s.albumid || s.albumId || s.album?.id,
            album: decodeHtmlEntities(s.album?.name || s.album?.title || s.albumName || s.album || ''),
            albumArtwork,
          };
        });
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

  const handlePlayPress = async () => {
    if (isPlaylistTrack) {
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
      } catch (e) { console.warn('play fetch failed', e); }
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
    if (!playlistId) return;
    togglePlaylistFavorite({
      id: playlistId,
      title: playlistTitle,
      image: playlistImage,
      songs,
    });
  };

  const handleMorePress = () => {
    Alert.alert('More', 'More options');
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
      coverImage={playlistImage}
      coverImages={playlistCoverImages}
      title={playlistTitle || 'Playlist'}
      subtitle={`${(playlist?.songCount || songs.length) || 0} songs`}
      isLiked={playlistLiked}
      onLikePress={handleLikePress}
      onPlayPress={handlePlayPress}
      onShufflePress={handleShufflePress}
      isPlayActive={isPlaylistPlaying}
      data={songs.slice(0, displayCount)}
      keyExtractor={(i: any, idx: number) => (i?.id?.toString ? i.id.toString() : String(idx))}
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
            if (!s.albumId) return;
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
        />
      )}
    />
  );
};

export default PlaylistScreen;

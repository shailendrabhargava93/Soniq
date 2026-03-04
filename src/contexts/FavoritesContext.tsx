import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  readFavourites,
  persistFavourites,
  FAVOURITE_SONGS_KEY,
  FAVOURITE_ALBUMS_KEY,
  FAVOURITE_PLAYLISTS_KEY,
  FAVOURITE_ARTISTS_KEY,
  FavouriteKey,
} from '../services/storageCompat';

export interface FavoriteSong extends Record<string, any> {
  id: string;
  title?: string;
  artist?: string;
  artwork?: string;
  image?: string;
  album?: string;
  albumId?: string;
  uri?: string;
}

export interface FavoriteAlbum extends Record<string, any> {
  id: string;
  title?: string;
  image?: string;
}

export interface FavoritePlaylist extends Record<string, any> {
  id: string;
  title?: string;
  image?: string;
}

export interface FavoriteArtist extends Record<string, any> {
  id: string;
  name?: string;
  image?: string;
}

export interface FavoritesContextType {
  hydrated: boolean;
  songs: FavoriteSong[];
  albums: FavoriteAlbum[];
  playlists: FavoritePlaylist[];
  artists: FavoriteArtist[];
  addSongFavorite: (song: FavoriteSong) => Promise<void>;
  removeSongFavorite: (songId: string) => Promise<void>;
  toggleSongFavorite: (song: FavoriteSong) => Promise<void>;
  isSongFavorite: (songId: string) => boolean;
  addAlbumFavorite: (album: FavoriteAlbum) => Promise<void>;
  removeAlbumFavorite: (albumId: string) => Promise<void>;
  toggleAlbumFavorite: (album: FavoriteAlbum) => Promise<void>;
  isAlbumFavorite: (albumId: string) => boolean;
  addPlaylistFavorite: (playlist: FavoritePlaylist) => Promise<void>;
  removePlaylistFavorite: (playlistId: string) => Promise<void>;
  togglePlaylistFavorite: (playlist: FavoritePlaylist) => Promise<void>;
  isPlaylistFavorite: (playlistId: string) => boolean;
  addArtistFavorite: (artist: FavoriteArtist) => Promise<void>;
  removeArtistFavorite: (artistId: string) => Promise<void>;
  toggleArtistFavorite: (artist: FavoriteArtist) => Promise<void>;
  isArtistFavorite: (artistId: string) => boolean;
}

const noopAsync = async () => {};
const noopBoolean = () => false;

const FallbackContext: FavoritesContextType = {
  hydrated: false,
  songs: [],
  albums: [],
  playlists: [],
  artists: [],
  addSongFavorite: noopAsync,
  removeSongFavorite: noopAsync,
  toggleSongFavorite: noopAsync,
  isSongFavorite: noopBoolean,
  addAlbumFavorite: noopAsync,
  removeAlbumFavorite: noopAsync,
  toggleAlbumFavorite: noopAsync,
  isAlbumFavorite: noopBoolean,
  addPlaylistFavorite: noopAsync,
  removePlaylistFavorite: noopAsync,
  togglePlaylistFavorite: noopAsync,
  isPlaylistFavorite: noopBoolean,
  addArtistFavorite: noopAsync,
  removeArtistFavorite: noopAsync,
  toggleArtistFavorite: noopAsync,
  isArtistFavorite: noopBoolean,
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const normalizeId = (value: any) => (value !== undefined && value !== null ? String(value) : '');

const normalizeSong = (song: FavoriteSong): FavoriteSong | null => {
  const id = normalizeId(song?.id);
  if (!id) return null;
  const artwork = song?.artwork || song?.image || song?.cover;
  return {
    ...song,
    id,
    artwork,
    image: artwork || song?.image,
  };
};

const normalizeAlbum = (album: FavoriteAlbum): FavoriteAlbum | null => {
  const id = normalizeId(album?.id || album?.albumId || album?.sid);
  if (!id) return null;
  const image = album?.image || album?.artwork || album?.cover;
  return {
    ...album,
    id,
    image,
  };
};

const normalizePlaylist = (playlist: FavoritePlaylist): FavoritePlaylist | null => {
  const id = normalizeId(playlist?.id || playlist?.playlistId || playlist?.pid || playlist?.sid);
  if (!id) return null;
  const image = playlist?.image || playlist?.artwork || playlist?.thumbnail;
  return {
    ...playlist,
    id,
    image,
  };
};

const normalizeArtist = (artist: FavoriteArtist): FavoriteArtist | null => {
  const id = normalizeId(artist?.id || artist?.artistId || artist?.sid);
  if (!id) return null;
  const name = artist?.name || artist?.title;
  const image = artist?.image || artist?.artwork || artist?.photo;
  return {
    ...artist,
    id,
    name,
    image,
  };
};

const normalizeList = <T extends Record<string, any>>(items: unknown[], normalizer: (value: any) => T | null) => {
  if (!Array.isArray(items)) return [] as T[];
  const seen = new Set<string>();
  const result: T[] = [];
  items.forEach((raw) => {
    const normalized = normalizer(raw);
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      result.push(normalized);
    }
  });
  return result;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    console.warn('useFavorites called outside FavoritesProvider — returning fallback no-op implementation');
    return FallbackContext;
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<FavoriteSong[]>([]);
  const [albums, setAlbums] = useState<FavoriteAlbum[]>([]);
  const [playlists, setPlaylists] = useState<FavoritePlaylist[]>([]);
  const [artists, setArtists] = useState<FavoriteArtist[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedSongs, storedAlbums, storedPlaylists, storedArtists] = await Promise.all([
          readFavourites(FAVOURITE_SONGS_KEY),
          readFavourites(FAVOURITE_ALBUMS_KEY),
          readFavourites(FAVOURITE_PLAYLISTS_KEY),
          readFavourites(FAVOURITE_ARTISTS_KEY),
        ]);
        if (cancelled) return;
        setSongs(normalizeList<FavoriteSong>(storedSongs as FavoriteSong[], normalizeSong));
        setAlbums(normalizeList<FavoriteAlbum>(storedAlbums as FavoriteAlbum[], normalizeAlbum));
        setPlaylists(normalizeList<FavoritePlaylist>(storedPlaylists as FavoritePlaylist[], normalizePlaylist));
        setArtists(normalizeList<FavoriteArtist>(storedArtists as FavoriteArtist[], normalizeArtist));
      } catch (err) {
        console.warn('[Favorites] failed to hydrate favourites', err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistList = useCallback(async (key: FavouriteKey, list: unknown[]) => {
    try {
      await persistFavourites(key, list);
    } catch (err) {
      console.warn(`[Favorites] failed to persist ${key}`, err);
    }
  }, []);

  const addSongFavorite = useCallback(async (song: FavoriteSong) => {
    if (!song) return;
    let nextList: FavoriteSong[] | null = null;
    setSongs((prev) => {
      const normalized = normalizeSong(song);
      if (!normalized) return prev;
      if (prev.some((existing) => existing.id === normalized.id)) return prev;
      nextList = [...prev, normalized];
      return nextList;
    });
    if (nextList) await persistList(FAVOURITE_SONGS_KEY, nextList);
  }, [persistList]);

  const removeSongFavorite = useCallback(async (songId: string) => {
    if (!songId) return;
    let nextList: FavoriteSong[] | null = null;
    setSongs((prev) => {
      if (!prev.some((existing) => existing.id === songId)) return prev;
      nextList = prev.filter((existing) => existing.id !== songId);
      return nextList;
    });
    if (nextList) await persistList(FAVOURITE_SONGS_KEY, nextList);
  }, [persistList]);

  const toggleSongFavorite = useCallback(async (song: FavoriteSong) => {
    if (!song?.id) return;
    if (songs.some((existing) => existing.id === normalizeId(song.id))) {
      await removeSongFavorite(normalizeId(song.id));
    } else {
      await addSongFavorite(song);
    }
  }, [addSongFavorite, removeSongFavorite, songs]);

  const isSongFavorite = useCallback((songId: string) => {
    if (!songId) return false;
    const normalizedId = normalizeId(songId);
    return songs.some((song) => song.id === normalizedId);
  }, [songs]);

  const addAlbumFavorite = useCallback(async (album: FavoriteAlbum) => {
    if (!album) return;
    let nextList: FavoriteAlbum[] | null = null;
    setAlbums((prev) => {
      const normalized = normalizeAlbum(album);
      if (!normalized) return prev;
      if (prev.some((existing) => existing.id === normalized.id)) return prev;
      nextList = [...prev, normalized];
      return nextList;
    });
    if (nextList) await persistList(FAVOURITE_ALBUMS_KEY, nextList);
  }, [persistList]);

  const removeAlbumFavorite = useCallback(async (albumId: string) => {
    if (!albumId) return;
    let nextList: FavoriteAlbum[] | null = null;
    setAlbums((prev) => {
      if (!prev.some((existing) => existing.id === albumId)) return prev;
      nextList = prev.filter((existing) => existing.id !== albumId);
      return nextList;
    });
    if (nextList) await persistList(FAVOURITE_ALBUMS_KEY, nextList);
  }, [persistList]);

  const toggleAlbumFavorite = useCallback(async (album: FavoriteAlbum) => {
    if (!album?.id) return;
    const normalizedId = normalizeId(album.id);
    if (albums.some((existing) => existing.id === normalizedId)) {
      await removeAlbumFavorite(normalizedId);
    } else {
      await addAlbumFavorite(album);
    }
  }, [addAlbumFavorite, albums, removeAlbumFavorite]);

  const isAlbumFavorite = useCallback((albumId: string) => {
    if (!albumId) return false;
    const normalizedId = normalizeId(albumId);
    return albums.some((album) => album.id === normalizedId);
  }, [albums]);

  const addPlaylistFavorite = useCallback(async (playlist: FavoritePlaylist) => {
    if (!playlist) return;
    let nextList: FavoritePlaylist[] | null = null;
    setPlaylists((prev) => {
      const normalized = normalizePlaylist(playlist);
      if (!normalized) return prev;
      if (prev.some((existing) => existing.id === normalized.id)) return prev;
      nextList = [...prev, normalized];
      return nextList;
    });
    if (nextList) await persistList(FAVOURITE_PLAYLISTS_KEY, nextList);
  }, [persistList]);

  const removePlaylistFavorite = useCallback(async (playlistId: string) => {
    if (!playlistId) return;
    let nextList: FavoritePlaylist[] | null = null;
    setPlaylists((prev) => {
      if (!prev.some((existing) => existing.id === playlistId)) return prev;
      nextList = prev.filter((existing) => existing.id !== playlistId);
      return nextList;
    });
    if (nextList) await persistList(FAVOURITE_PLAYLISTS_KEY, nextList);
  }, [persistList]);

  const togglePlaylistFavorite = useCallback(async (playlist: FavoritePlaylist) => {
    if (!playlist?.id) return;
    const normalizedId = normalizeId(playlist.id);
    if (playlists.some((existing) => existing.id === normalizedId)) {
      await removePlaylistFavorite(normalizedId);
    } else {
      await addPlaylistFavorite(playlist);
    }
  }, [addPlaylistFavorite, playlists, removePlaylistFavorite]);

  const isPlaylistFavorite = useCallback((playlistId: string) => {
    if (!playlistId) return false;
    const normalizedId = normalizeId(playlistId);
    return playlists.some((playlist) => playlist.id === normalizedId);
  }, [playlists]);

  const addArtistFavorite = useCallback(async (artist: FavoriteArtist) => {
    if (!artist) return;
    let nextList: FavoriteArtist[] | null = null;
    setArtists((prev) => {
      const normalized = normalizeArtist(artist);
      if (!normalized) return prev;
      if (prev.some((existing) => existing.id === normalized.id)) return prev;
      nextList = [...prev, normalized];
      return nextList;
    });
    if (nextList) await persistList(FAVOURITE_ARTISTS_KEY, nextList);
  }, [persistList]);

  const removeArtistFavorite = useCallback(async (artistId: string) => {
    if (!artistId) return;
    let nextList: FavoriteArtist[] | null = null;
    setArtists((prev) => {
      if (!prev.some((existing) => existing.id === artistId)) return prev;
      nextList = prev.filter((existing) => existing.id !== artistId);
      return nextList;
    });
    if (nextList) await persistList(FAVOURITE_ARTISTS_KEY, nextList);
  }, [persistList]);

  const toggleArtistFavorite = useCallback(async (artist: FavoriteArtist) => {
    if (!artist?.id) return;
    const normalizedId = normalizeId(artist.id);
    if (artists.some((existing) => existing.id === normalizedId)) {
      await removeArtistFavorite(normalizedId);
    } else {
      await addArtistFavorite(artist);
    }
  }, [addArtistFavorite, artists, removeArtistFavorite]);

  const isArtistFavorite = useCallback((artistId: string) => {
    if (!artistId) return false;
    const normalizedId = normalizeId(artistId);
    return artists.some((artist) => artist.id === normalizedId);
  }, [artists]);

  const value = useMemo<FavoritesContextType>(() => ({
    hydrated,
    songs,
    albums,
    playlists,
    artists,
    addSongFavorite,
    removeSongFavorite,
    toggleSongFavorite,
    isSongFavorite,
    addAlbumFavorite,
    removeAlbumFavorite,
    toggleAlbumFavorite,
    isAlbumFavorite,
    addPlaylistFavorite,
    removePlaylistFavorite,
    togglePlaylistFavorite,
    isPlaylistFavorite,
    addArtistFavorite,
    removeArtistFavorite,
    toggleArtistFavorite,
    isArtistFavorite,
  }), [
    hydrated,
    songs,
    albums,
    playlists,
    artists,
    addSongFavorite,
    removeSongFavorite,
    toggleSongFavorite,
    isSongFavorite,
    addAlbumFavorite,
    removeAlbumFavorite,
    toggleAlbumFavorite,
    isAlbumFavorite,
    addPlaylistFavorite,
    removePlaylistFavorite,
    togglePlaylistFavorite,
    isPlaylistFavorite,
    addArtistFavorite,
    removeArtistFavorite,
    toggleArtistFavorite,
    isArtistFavorite,
  ]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
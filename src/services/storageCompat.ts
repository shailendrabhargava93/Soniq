import { storageSet, storageGet, storageRemove } from './storage';

export type FavouriteKey = 'favouriteSongs' | 'favouriteAlbums' | 'favouritePlaylists' | 'favouriteArtists';

export const FAVOURITE_SONGS_KEY: FavouriteKey = 'favouriteSongs';
export const FAVOURITE_ALBUMS_KEY: FavouriteKey = 'favouriteAlbums';
export const FAVOURITE_PLAYLISTS_KEY: FavouriteKey = 'favouritePlaylists';
export const FAVOURITE_ARTISTS_KEY: FavouriteKey = 'favouriteArtists';

export async function setMeta(key: string, value: unknown) {
  await storageSet(`meta:${key}`, value);
}

export async function getMeta(key: string) {
  return await storageGet(`meta:${key}`);
}

export async function readFavourites(key: FavouriteKey) {
  const stored = await getMeta(key);
  return Array.isArray(stored) ? stored : [];
}

export async function persistFavourites(key: FavouriteKey, items: unknown[]) {
  await setMeta(key, items);
}

export async function deleteMeta(key: string) {
  await storageRemove(`meta:${key}`);
}

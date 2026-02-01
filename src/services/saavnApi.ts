import { fetchJson, withInflight } from '../utils/fetch';
import { setLastFetchFailed } from './networkStatus';
import { getBestImage } from '../utils/normalize';
import type { Any } from '../types/api';
import { getMeta, setMeta } from './storageCompat';

const BASE_URL = 'https://saavn-api-client.vercel.app/api';

const getInflight = () => {
  if (!(saavnApi as unknown as Record<string, unknown>)._inflight) (saavnApi as unknown as Record<string, unknown>)._inflight = {} as Record<string, unknown>;
  const root = (saavnApi as unknown as Record<string, any>)._inflight as Record<string, Map<string, Promise<unknown>>>;
  root.playlists = root.playlists ?? new Map<string, Promise<unknown>>();
  root.albums = root.albums ?? new Map<string, Promise<unknown>>();
  root.artists = root.artists ?? new Map<string, Promise<unknown>>();
  root.searches = root.searches ?? new Map<string, Promise<unknown>>();
  root.songsByIds = root.songsByIds ?? new Map<string, Promise<unknown>>();
  root.launches = root.launches ?? new Map<string, Promise<unknown>>();
  return root as {
    playlists: Map<string, Promise<unknown>>;
    albums: Map<string, Promise<unknown>>;
    artists: Map<string, Promise<unknown>>;
    searches: Map<string, Promise<unknown>>;
    songsByIds: Map<string, Promise<unknown>>;
    launches: Map<string, Promise<unknown>>;
  };
};

const markFetchFailed = (message?: string) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setLastFetchFailed(true, message ?? 'Network offline');
  } else {
    setLastFetchFailed(false);
  }
};

export const saavnApi = {
  searchSongs: async (query: string, limit: number = 20): Promise<unknown> => {
    try {
      const inflight = getInflight().searches;
      const key = `${query}::${limit}`;
      return await withInflight(inflight, key, () => fetchJson(`${BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=0&limit=${limit}`, 'Songs search failed'));
    } catch (error) {
      console.error('Error searching songs:', error);
      markFetchFailed();
      throw error;
    }
  },

  launch: async (): Promise<unknown> => {
    try {
      const inflight = getInflight().launches;
      const key = 'launch';

      // Try to return cached launch payload immediately if available,
      // and refresh in background to update the cache.
      try {
        const cached = await getMeta('launch');
        if (cached) {
          // Kick off background refresh but don't await it here
          (async () => {
            try {
              await withInflight(inflight, key, async () => {
                const response = await fetch(`${BASE_URL}/launch`);
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('Launch API Error (bg):', response.status, errorText);
                  throw new Error('Launch API failed');
                }
                const data = await response.json();
                setLastFetchFailed(false);
                await setMeta('launch', data);
                return data;
              });
            } catch (e) {
              // background fetch failed — ignore here
            }
          })();
          return cached;
        }
      } catch (e) {
        // ignore cache read errors and proceed to fetch
      }

      if (inflight.has(key)) return inflight.get(key)!;

      const promise = (async () => {
        console.log('[saavnApi] Fetching launch from API...');
        const response = await fetch(`${BASE_URL}/launch`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Launch API Error:', response.status, errorText);
          throw new Error('Launch API failed');
        }
        const data = await response.json();
        console.log('[saavnApi] Launch API response:', data ? Object.keys(data) : 'null');
        setLastFetchFailed(false);
        try { 
          await setMeta('launch', data); 
          console.log('[saavnApi] Cached launch to AsyncStorage');
        } catch (err) {
          console.warn('[saavnApi] Failed to cache launch:', err);
        }
        return data;
      })();

      inflight.set(key, promise);
      try {
        const res = await promise;
        return res;
      } finally {
        inflight.delete(key);
      }
    } catch (error) {
      console.error('Error calling launch API:', error);
      markFetchFailed('Failed to call launch API');
      throw error;
    }
  },

  getAlbumById: async (albumId: string, limit: number = 100): Promise<unknown> => {
    try {
      const inflight = getInflight().albums;
      if (inflight.has(albumId)) return inflight.get(albumId)!;

      return await withInflight(inflight, albumId, async () => {
        const data = await fetchJson(`${BASE_URL}/albums?id=${albumId}&limit=${limit}&page=0`, 'Failed to fetch album');
        try {
          const songsFromData = Array.isArray(data?.data?.songs) ? data.data.songs : Array.isArray(data?.songs) ? data.songs : Array.isArray(data?.data) ? data.data : [];
          if (!Array.isArray(data?.data?.songs) && songsFromData.length > 0) {
            data.data = data.data || {};
            data.data.songs = songsFromData;
          }
        } catch {
          // ignore
        }
        return data;
      });
    } catch (error) {
      console.error('Error fetching album:', error);
      markFetchFailed();
      throw error;
    }
  },

  // add other endpoints as needed in the future
};

export default saavnApi;

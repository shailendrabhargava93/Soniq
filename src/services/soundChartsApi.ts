import { fetchJson, withInflight } from '../utils/fetch';
import { getBestImage } from '../utils/normalize';

const BASE_URL = process.env.EXPO_PUBLIC_SOUNDCHARTS_BASE_URL || 'https://customer.api.soundcharts.com/api/v2.14';
const CHART_PATH = '/chart/song/top-songs-29/ranking/latest';

// Local fallback values to keep development unblocked when Expo env injection is not picked up.
const APP_ID =
  process.env.EXPO_PUBLIC_SOUNDCHARTS_APP_ID ||
  process.env.SOUNDCHARTS_APP_ID ||
  'TBOY-API_3DE8C120';
const API_KEY =
  process.env.EXPO_PUBLIC_SOUNDCHARTS_API_KEY ||
  process.env.SOUNDCHARTS_API_KEY ||
  'c228e42eab8a5997';

const inflight = new Map<string, Promise<TopSongsResponse>>();

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

const parseItems = (payload: any): any[] => {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.ranking)) return payload.ranking;
  if (Array.isArray(payload?.ranking?.items)) return payload.ranking.items;
  if (Array.isArray(payload?.ranking?.songs)) return payload.ranking.songs;
  if (Array.isArray(payload?.chart?.items)) return payload.chart.items;
  if (Array.isArray(payload?.chart?.songs)) return payload.chart.songs;
  if (Array.isArray(payload?.entries)) return payload.entries;
  return [];
};

const normalizeSong = (entry: any, index: number) => {
  const song = entry?.song || entry?.track || entry;
  const title = asText(song?.name) || asText(song?.title) || asText(song?.song) || '';
  const artist =
    asText(song?.creditName) ||
    asText(song?.artistName) ||
    asText(song?.artist) ||
    asText(entry?.creditName) ||
    asText(entry?.artistName) ||
    asText(entry?.artist) ||
    '';
  const image =
    asText(song?.imageUrl) ||
    asText(song?.coverUrl) ||
    getBestImage(song?.image) ||
    getBestImage(song?.images) ||
    asText(entry?.imageUrl) ||
    asText(entry?.coverUrl) ||
    getBestImage(entry?.image) ||
    getBestImage(entry?.images) ||
    '';

  const songId =
    asText(song?.songId) ||
    asText(song?.id) ||
    asText(song?.uuid) ||
    asText(entry?.songId) ||
    asText(entry?.id) ||
    asText(entry?.uuid);

  const id = songId || `soundcharts-top-song-${index}-${title || 'unknown'}`;

  return {
    id,
    songId: songId || undefined,
    position: Number(entry?.position ?? entry?.rank ?? index + 1),
    title,
    subtitle: artist,
    artist,
    image,
    type: 'song' as const,
  };
};

export type TopSongItem = ReturnType<typeof normalizeSong>;

export type TopSongsResponse = {
  items: TopSongItem[];
  raw: unknown;
};

export const soundChartsApi = {
  getTopSongs: async (offset = 0, limit = 10): Promise<TopSongsResponse> => {
    if (!APP_ID || !API_KEY) {
      throw new Error(
        'Missing SoundCharts credentials. Set EXPO_PUBLIC_SOUNDCHARTS_APP_ID and EXPO_PUBLIC_SOUNDCHARTS_API_KEY in env.'
      );
    }

    const key = `${offset}:${limit}`;
    return withInflight(inflight, key, async () => {
      const url = `${BASE_URL}${CHART_PATH}?offset=${offset}&limit=${limit}`;
      const payload = await fetchJson(url, {
        errorMessage: 'Failed to load top songs in India',
        timeoutMs: 8000,
        retries: 1,
        headers: {
          'x-app-id': APP_ID,
          'x-api-key': API_KEY,
        },
      });
      const rawItems = parseItems(payload);
      const items = rawItems
        .map((entry, index) => normalizeSong(entry, index))
        .filter((item) => item.title);
      return { items, raw: payload };
    });
  },
};

export default soundChartsApi;

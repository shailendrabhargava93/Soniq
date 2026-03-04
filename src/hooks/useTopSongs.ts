import { useCallback, useEffect, useRef, useState } from 'react';
import { saavnApi } from '../services/saavnApi';
import { soundChartsApi, type TopSongItem } from '../services/soundChartsApi';
import { getMeta, setMeta } from '../services/storageCompat';
import { joinArtistIds, joinArtistNames, normalizeArtist, normalizeText, similarityScore } from '../utils/normalize';

const CHART_CACHE_KEY = 'chartSongs';
const CHART_TIMESTAMP_KEY = 'chartSongsTimestamp';
const FETCH_LIMIT = 100;
const SEARCH_DELAY_MS = 200;

type SaavnArtist = { id?: string; name?: string };

type SaavnSong = {
  id: string;
  name: string;
  album: string;
  year: string;
  duration: number;
  primaryArtists: string;
  primaryArtistsId: string;
  featuredArtists: string;
  featuredArtistsId: string;
  image: any;
  downloadUrl: any;
  [key: string]: unknown;
};

export type TopSongListItem = TopSongItem & {
  saavnData?: SaavnSong;
  isSearching?: boolean;
};

const getSaavnResults = (response: any): any[] => {
  const candidates =
    response?.data?.results ??
    response?.results ??
    response?.data ??
    [];
  return Array.isArray(candidates) ? candidates : [];
};

const asArtists = (value: unknown): SaavnArtist[] => (Array.isArray(value) ? (value as SaavnArtist[]) : []);

const getSongName = (item: any): string =>
  (typeof item?.name === 'string' ? item.name : typeof item?.title === 'string' ? item.title : '').trim();

const toSaavnSong = (match: any): SaavnSong => {
  const primary = asArtists(match?.artists?.primary);
  const featured = asArtists(match?.artists?.featured);

  return {
    ...match,
    id: String(match?.id ?? ''),
    name: typeof match?.name === 'string' ? match.name : '',
    album: typeof match?.album?.name === 'string' ? match.album.name : typeof match?.album === 'string' ? match.album : '',
    year: String(match?.year ?? ''),
    duration: Number(match?.duration ?? 0),
    primaryArtists: joinArtistNames(primary),
    primaryArtistsId: joinArtistIds(primary),
    featuredArtists: joinArtistNames(featured),
    featuredArtistsId: joinArtistIds(featured),
    image: match?.image ?? [],
    downloadUrl: match?.downloadUrl ?? [],
  };
};

const searchSongOnSaavn = async (item: TopSongItem): Promise<SaavnSong | undefined> => {
  const targetSongName = normalizeText(item.title || '');
  const targetArtist = normalizeArtist(item.artist || item.subtitle || '');

  if (!targetSongName) return undefined;

  const scoreCandidates = (results: any[]) => {
    let best: any | null = null;
    let bestTotal = -1;

    for (const result of results) {
      const resultSongName = normalizeText(getSongName(result));
      const primary = asArtists(result?.artists?.primary);
      const featured = asArtists(result?.artists?.featured);
      const resultArtist = normalizeArtist(joinArtistNames([...primary, ...featured]));

      const songNameScore = similarityScore(targetSongName, resultSongName);
      const artistScore = similarityScore(targetArtist, resultArtist);
      const totalScore = 0.7 * songNameScore + 0.3 * artistScore;

      if (songNameScore > 0.5 && totalScore > bestTotal) {
        best = result;
        bestTotal = totalScore;
      }
    }

    return best;
  };

  try {
    const primarySearchResp = await saavnApi.searchSongs(item.title, 15);
    const primaryResults = getSaavnResults(primarySearchResp);
    const primaryBest = scoreCandidates(primaryResults);
    if (primaryBest) return toSaavnSong(primaryBest);

    const fallbackQuery = [item.title, item.artist || item.subtitle].filter(Boolean).join(' ').trim();
    if (!fallbackQuery) return undefined;

    const fallbackResp = await saavnApi.searchSongs(fallbackQuery, 10);
    const fallbackResults = getSaavnResults(fallbackResp);
    let fallbackBest: any | null = null;
    let fallbackBestScore = -1;

    for (const result of fallbackResults) {
      const resultSongName = normalizeText(getSongName(result));
      const songNameScore = similarityScore(targetSongName, resultSongName);
      if (songNameScore > 0.5 && songNameScore > fallbackBestScore) {
        fallbackBest = result;
        fallbackBestScore = songNameScore;
      }
    }

    return fallbackBest ? toSaavnSong(fallbackBest) : undefined;
  } catch (err) {
    console.warn('[useTopSongs] searchSongOnSaavn failed:', err);
    return undefined;
  }
};

export function useTopSongs(limit = 10) {
  const mountedRef = useRef(true);
  const [allItems, setAllItems] = useState<TopSongListItem[]>([]);
  const [items, setItems] = useState<TopSongListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const applyItems = useCallback((list: TopSongListItem[]) => {
    if (!mountedRef.current) return;
    setAllItems(list);
    setItems(list.slice(0, limit));
  }, [limit]);

  const fetchAndResolveTopSongs = useCallback(async (): Promise<TopSongListItem[]> => {
    const res = await soundChartsApi.getTopSongs(0, FETCH_LIMIT);
    const baseItems: TopSongListItem[] = res.items.map((item) => ({ ...item, isSearching: true }));
    applyItems(baseItems);

    const resolved = [...baseItems];
    for (let i = 0; i < resolved.length; i++) {
      const source = resolved[i];
      const saavnData = await searchSongOnSaavn(source);
      resolved[i] = {
        ...source,
        saavnData,
        songId: saavnData?.id || source.songId,
        isSearching: false,
      };
      applyItems([...resolved]);
      await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS));
    }

    await setMeta(CHART_CACHE_KEY, resolved);
    await setMeta(CHART_TIMESTAMP_KEY, Date.now());
    return resolved;
  }, [applyItems]);

  const load = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      await fetchAndResolveTopSongs();
    } catch (err) {
      console.error('[useTopSongs] refresh failed:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchAndResolveTopSongs]);

  useEffect(() => {
    setItems(allItems.slice(0, limit));
  }, [allItems, limit]);

  useEffect(() => {
    mountedRef.current = true;
    let mounted = true;
    (async () => {
      try {
        const cached = await getMeta(CHART_CACHE_KEY);
        if (mounted && Array.isArray(cached)) {
          const cachedItems = cached as TopSongListItem[];
          applyItems(cachedItems);
          setError(null);
          if (cachedItems.length >= FETCH_LIMIT) {
            setLoading(false);
            return;
          }
        }

        const resolved = await fetchAndResolveTopSongs();
        if (!mounted) return;
        applyItems(resolved);
        setError(null);
      } catch (err) {
        console.error('[useTopSongs] initial fetch failed:', err);
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
      mounted = false;
    };
  }, [applyItems, fetchAndResolveTopSongs]);

  return { items, allItems, loading, error, refresh: load };
}

export default useTopSongs;

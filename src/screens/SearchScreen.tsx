import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Chip, Avatar, Portal, Dialog, Button } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';
import { saavnApi } from '../services/saavnApi';
import { getBestImage, decodeHtmlEntities, getPlayableUrl } from '../utils/normalize';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { getMeta, setMeta, deleteMeta } from '../services/storageCompat';
import MediaRow from '../components/MediaRow';
import Header from '../components/Header';

const RECENT_SEARCHES_KEY = 'recentSearches';
const HEADER_HEIGHT = 60;
const filters = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'songs', label: 'Songs', icon: 'music-note' },
  { key: 'albums', label: 'Albums', icon: 'album' },
  { key: 'playlists', label: 'Playlists', icon: 'playlist-play' },
  { key: 'artists', label: 'Artists', icon: 'account-music' }
];

const SearchScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { playSong, open, addToQueue, playNext } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [topSearches, setTopSearches] = useState<any[]>([]);
  const [clearSearchDialogVisible, setClearSearchDialogVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp: any = await (saavnApi as any).searchTop();
        const list = resp || [];
        // normalize items to have a text and image
        const normalized = list.map((it: any) => ({
          id: it.id || it.query || it.name,
          text: it.query || it.name || it.title || it.text,
          image: getBestImage(it.image || it.thumbnail || it.cover)
        })).filter((i: any) => i.text);
        if (mounted) setTopSearches(normalized);
      } catch (e) {
        console.warn('Failed to load top searches', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const stored = await getMeta(RECENT_SEARCHES_KEY);
      if (isMounted && Array.isArray(stored)) {
        setRecentSearches(stored);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const resp: any = await (saavnApi as any).search(query);
      const payload = resp?.data?.data || resp?.data || resp || {};

      const results: any = {
        topQuery: [],
        songs: [],
        albums: [],
        playlists: [],
        artists: [],
        positions: {},
      };

      if (Array.isArray(payload?.topQuery?.results)) {
        results.topQuery = payload.topQuery.results.map((entry: any) => ({
          id: entry.id,
          type: entry.type || 'artist',
          title: decodeHtmlEntities(entry.title || entry.name || ''),
          name: decodeHtmlEntities(entry.title || entry.name || ''),
          subtitle: decodeHtmlEntities(entry.description || ''),
          image: getBestImage(entry.image),
        }));
        results.positions.topQuery = typeof payload.topQuery.position === 'number' ? payload.topQuery.position : 999;
      }

      if (Array.isArray(payload?.songs?.results)) {
        results.songs = payload.songs.results.map((song: any) => ({
          id: song.id,
          title: decodeHtmlEntities(song.title || song.name),
          artist: decodeHtmlEntities(song.primaryArtists || song.singers || song.description || song.subtitle || ''),
          subtitle: decodeHtmlEntities(song.description || song.primaryArtists || song.subtitle || ''),
          artwork: getBestImage(song.image),
          image: getBestImage(song.image),
          uri: song.url || '',
          albumId: song.album?.id || song.albumId,
          album: decodeHtmlEntities(song.album?.name || song.album?.title || song.albumName || song.album || ''),
          type: 'song'
        }));
        results.positions.songs = typeof payload.songs.position === 'number' ? payload.songs.position : 999;
      }
      
      if (Array.isArray(payload?.albums?.results)) {
        results.albums = payload.albums.results.map((album: any) => ({
          id: album.id,
          title: decodeHtmlEntities(album.title || album.name),
          subtitle: decodeHtmlEntities(album.artist || album.description || album.primaryArtists || album.subtitle || ''),
          image: getBestImage(album.image),
          type: 'album'
        }));
        results.positions.albums = typeof payload.albums.position === 'number' ? payload.albums.position : 999;
      }
      
      if (Array.isArray(payload?.playlists?.results)) {
        results.playlists = payload.playlists.results.map((playlist: any) => ({
          id: playlist.id,
          title: decodeHtmlEntities(playlist.title || playlist.name),
          subtitle: decodeHtmlEntities(playlist.description || playlist.subtitle || `${playlist.songCount || 0} songs`),
          image: getBestImage(playlist.image),
          type: 'playlist'
        }));
        results.positions.playlists = typeof payload.playlists.position === 'number' ? payload.playlists.position : 999;
      }
      
      if (Array.isArray(payload?.artists?.results)) {
        results.artists = payload.artists.results.map((artist: any) => ({
          id: artist.id,
          name: decodeHtmlEntities(artist.title || artist.name),
          title: decodeHtmlEntities(artist.title || artist.name),
          subtitle: decodeHtmlEntities(artist.description || 'Artist'),
          image: getBestImage(artist.image),
          type: 'artist'
        }));
        results.positions.artists = typeof payload.artists.position === 'number' ? payload.artists.position : 999;
      }
      
      setSearchResults(results);
    } catch (e) {
      console.warn('Search failed', e);
      setSearchResults({});
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (submittedQuery.trim().length > 0) {
      performSearch(submittedQuery);
    } else {
      setSearchResults({});
    }
  }, [performSearch, submittedQuery]);

  const handleQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSubmittedQuery('');
      setSearchResults({});
      setIsSearching(false);
      setSelectedFilter('all');
    }
  }, []);

  const persistRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, 10);
      setMeta(RECENT_SEARCHES_KEY, next);
      return next;
    });
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setSubmittedQuery(trimmed);
    persistRecentSearch(trimmed);
  }, [persistRecentSearch, searchQuery]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setSubmittedQuery('');
    setSearchResults({});
    setIsSearching(false);
    setSelectedFilter('all');
  }, []);

  const clearRecentSearches = useCallback(() => {
    setClearSearchDialogVisible(true);
  }, []);

  const confirmClearRecentSearches = useCallback(async () => {
    setClearSearchDialogVisible(false);
    setRecentSearches([]);
    await deleteMeta(RECENT_SEARCHES_KEY);
  }, []);

  const handleRecentSearchPress = useCallback((query: string) => {
    setSearchQuery(query);
    persistRecentSearch(query);
    setSubmittedQuery(query.trim());
  }, [persistRecentSearch]);

  const handleTopSearchPress = useCallback((query: string) => {
    setSearchQuery(query);
    persistRecentSearch(query);
    setSubmittedQuery(query.trim());
  }, [persistRecentSearch]);

  const resolveSongUri = useCallback(async (item: any) => {
    if (item?.uri) return item.uri;
    const resp = await saavnApi.getSongById(item.id);
    const songData = (resp as any)?.data?.[0] || (resp as any)?.data?.songs?.[0] || (resp as any)?.data || resp;
    const uri = getPlayableUrl(songData) || '';
    if (uri) {
      item.uri = uri;
    }
    return uri;
  }, []);

  const playSearchSong = useCallback(async (item: any) => {
    try {
      const uri = await resolveSongUri(item);
      if (!uri) {
        Alert.alert('Playback error', 'No playable URL');
        return;
      }
      const track = {
        id: item.id,
        title: item.title,
        artist: item.artist || item.subtitle,
        uri,
        artwork: item.artwork || item.image
      };
      await playSong(track);
      open(track);
    } catch (e) {
      console.error('Failed to play song', e);
      Alert.alert('Error', 'Failed to play song');
    }
  }, [open, playSong, resolveSongUri]);

  const handleItemPress = useCallback(async (item: any) => {
    if (item.type === 'song' || (selectedFilter === 'all' && item.category === 'songs')) {
      try {
        await playSearchSong(item);
      } catch (e) {
        console.error('Failed to play song', e);
        Alert.alert('Error', 'Failed to play song');
      }
    } else if (item.type === 'album' || (selectedFilter === 'all' && item.category === 'albums')) {
      (navigation as any).navigate('Album', { album: item });
    } else if (item.type === 'playlist' || (selectedFilter === 'all' && item.category === 'playlists')) {
      (navigation as any).navigate('Playlist', { playlist: item });
    } else if (item.type === 'artist' || (selectedFilter === 'all' && item.category === 'artists')) {
      (navigation as any).navigate('Artist', { id: item.id, artist: item });
    }
  }, [navigation, playSearchSong, selectedFilter]);

  const filteredResults = useMemo(() => {
    if (selectedFilter === 'all') {
      const sectionKeys = ['topQuery', 'playlists', 'songs', 'albums', 'artists'];
      const sections = sectionKeys
        .map((key) => ({
          key,
          items: Array.isArray(searchResults?.[key]) ? searchResults[key] : [],
          position: typeof searchResults?.positions?.[key] === 'number' ? searchResults.positions[key] : 999,
        }))
        .filter((section) => section.items.length > 0)
        .sort((a, b) => a.position - b.position);

      const allResults: any[] = [];
      sections.forEach((section) => {
        allResults.push(...section.items.map((item: any) => ({ ...item, category: section.key })));
      });
      return allResults;
    }
    return searchResults[selectedFilter] || [];
  }, [searchResults, selectedFilter]);

  const renderSearchResult = useCallback(({ item }: { item: any }) => {
    if (item.type === 'song' || (selectedFilter === 'all' && item.category === 'songs')) {
      return (
        <MediaRow
          item={item}
          type="song"
          onPress={() => playSearchSong(item)}
          onPlayNow={(s: any) => playSearchSong(s)}
          onAddToQueue={(s: any) => addToQueue(s)}
          onPlayNext={(s: any) => playNext(s)}
          onGoToAlbum={(s: any) => {
            if (!s.albumId) return;
            (navigation as any).navigate('Album', {
              album: {
                id: s.albumId,
                albumId: s.albumId,
                title: s.album,
                name: s.album,
                image: s.artwork || s.image
              }
            });
          }}
        />
      );
    }

    if (item.type === 'artist' || (selectedFilter === 'all' && item.category === 'artists')) {
      return (
        <MediaRow
          item={item}
          type="artist"
          iconName="person"
          shape="round"
          onPress={() => handleItemPress(item)}
        />
      );
    }

    if (item.type === 'album' || (selectedFilter === 'all' && item.category === 'albums')) {
      return (
        <MediaRow
          item={item}
          type="album"
          iconName="album"
          onPress={() => handleItemPress(item)}
        />
      );
    }

    if (item.type === 'playlist' || (selectedFilter === 'all' && item.category === 'playlists')) {
      return (
        <MediaRow
          item={item}
          type="playlist"
          iconName="playlist-play"
          onPress={() => handleItemPress(item)}
        />
      );
    }

    return null;
  }, [addToQueue, handleItemPress, navigation, playNext, playSearchSong, selectedFilter]);

  const hasResults = useMemo(
    () => ['topQuery', 'songs', 'albums', 'playlists', 'artists']
      .some((key) => Array.isArray(searchResults?.[key]) && searchResults[key].length > 0),
    [searchResults],
  );

  const keyExtractor = useCallback((item: any, index: number) => `${item.type || item.category || 'item'}-${item.id || index}`, []);
  const chipBorderColor = theme.colors.outlineVariant;
  const inputChipRadius = 12;
  const sharedOutlineBorder = {
    borderWidth: 1,
    borderColor: chipBorderColor,
  } as const;

  const searchControls = (
    <View>
      <Searchbar
        placeholder="Search for songs, artists, albums"
        onChangeText={handleQueryChange}
        onSubmitEditing={handleSearchSubmit}
        value={searchQuery}
        onClearIconPress={handleSearchClear}
        onBlur={() => {
          if (!searchQuery.trim()) {
            handleSearchClear();
          }
        }}
        style={{
          marginBottom: 16,
          backgroundColor: theme.colors.surface,
          ...sharedOutlineBorder,
          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
          borderRadius: inputChipRadius,
        }}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        inputStyle={{ color: theme.colors.onSurface }}
        icon={() => <MaterialIcons name="search" size={20} color={theme.colors.onSurface} />}
      />

      {hasResults && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingLeft: 0, paddingRight: 4 }}>
          {filters.map((filter) => (
            <Chip
              key={filter.key}
              selected={selectedFilter === filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              mode={selectedFilter === filter.key ? 'flat' : 'outlined'}
              style={{
                marginRight: 8,
                backgroundColor: selectedFilter === filter.key ? theme.colors.primaryContainer : theme.colors.surface,
                ...sharedOutlineBorder,
                borderColor: selectedFilter === filter.key ? theme.colors.primary : chipBorderColor,
                borderRadius: inputChipRadius,
              }}
              textStyle={{
                color: selectedFilter === filter.key ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                fontWeight: selectedFilter === filter.key ? '700' : '500',
              }}
              showSelectedOverlay
              icon={() =>
                filter.key === 'artists' ? (
                  <MaterialCommunityIcons
                    name={filter.icon as any}
                    size={18}
                    color={selectedFilter === filter.key ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                ) : (
                  <MaterialIcons
                    name={filter.icon as any}
                    size={18}
                    color={selectedFilter === filter.key ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                )
              }
            >
              {filter.label}
            </Chip>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
        <Header title="Search" hideThemeToggle />
      </View>

      {hasResults ? (
        <FlatList
          data={filteredResults}
          keyExtractor={keyExtractor}
          renderItem={renderSearchResult}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListHeaderComponent={<View style={{ paddingBottom: 0 }}>{searchControls}</View>}
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 16, paddingBottom: 100, paddingHorizontal: 16 }}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 16, paddingBottom: 100 }}>
          <View style={{ paddingHorizontal: 16 }}>{searchControls}</View>
          <View style={{ paddingHorizontal: 16, flex: 1 }}>
            {submittedQuery.trim().length === 0 ? (
            <>
              {recentSearches.length > 0 && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons name="history" size={16} color={theme.colors.onSurfaceVariant} style={{ marginRight: 6 }} />
                      <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                        Recent Searches
                      </Text>
                    </View>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text variant="bodySmall" style={{ color: theme.colors.primary }}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                    {recentSearches.map((search, index) => (
                      <Chip
                        key={`${search}-${index}`}
                        onPress={() => handleRecentSearchPress(search)}
                        style={{ marginRight: 8 }}
                        textStyle={{ color: theme.colors.onSurface }}
                      >
                        {search}
                      </Chip>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <MaterialIcons name="trending-up" size={16} color={theme.colors.onSurfaceVariant} style={{ marginRight: 6 }} />
                <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                  Top Searches
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {topSearches.map((item, idx) => (
                  <Chip
                    key={`${item?.id || item?.text}-${idx}`}
                    style={{
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                    textStyle={{
                      color: theme.colors.onSurface,
                    }}
                    onPress={() => handleTopSearchPress(item.text)}
                    avatar={item.image ? <Avatar.Image size={24} source={{ uri: item.image }} /> : undefined}
                  >
                    {item.text}
                  </Chip>
                ))}
              </View>
            </>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 }}>
                {isSearching ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    No results found
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Clear Search Dialog */}
      <Portal>
        <Dialog
          visible={clearSearchDialogVisible}
          onDismiss={() => setClearSearchDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Clear Search History</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              Are you sure you want to remove your recent searches?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearSearchDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmClearRecentSearches} textColor={theme.colors.error}>Clear</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default SearchScreen;

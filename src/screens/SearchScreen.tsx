import React, { useState, useEffect } from 'react';
import { View, ScrollView, FlatList } from 'react-native';
import { Text, Searchbar, Chip, Card, Avatar } from 'react-native-paper';
import { saavnApi } from '../services/saavnApi';
import { getBestImage } from '../utils/normalize';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const SearchScreen = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const recentSearches = ['Rock Music', 'Jazz', 'Electronic', 'Hip Hop', 'Classical'];
  const [topSearches, setTopSearches] = useState<any[]>([]);

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 16 }}>
        <Searchbar
          placeholder="Search for songs, artists, albums"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ marginBottom: 16 }}
          icon={() => <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />}
        />

        <Text variant="titleMedium" style={{ color: theme.colors.onBackground, marginBottom: 12 }}>
          Recent Searches
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {recentSearches.map((search, index) => (
            <Chip
              key={index}
              onPress={() => setSearchQuery(search)}
              style={{ marginRight: 8 }}
              textStyle={{ color: theme.colors.onSurface }}
            >
              {search}
            </Chip>
          ))}
        </ScrollView>

        <Text variant="titleMedium" style={{ color: theme.colors.onBackground, marginBottom: 12 }}>
          Top Searches
        </Text>
        <FlatList
          data={topSearches}
          keyExtractor={(i, idx) => `${i?.id || i?.text}-${idx}`}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
          renderItem={({ item }) => (
            <Chip
              style={{ marginRight: 8, marginBottom: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 }}
              onPress={() => setSearchQuery(item.text)}
              avatar={item.image ? <Avatar.Image size={28} source={{ uri: item.image }} /> : undefined}
            >
              {item.text}
            </Chip>
          )}
        />
      </View>
    </View>
  );
};

export default SearchScreen;
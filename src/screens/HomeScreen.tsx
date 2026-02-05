import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  RefreshControl, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  IconButton, 
  ActivityIndicator,
  Surface,
  Chip
} from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { saavnApi } from '../services/saavnApi';
import { cacheService } from '../services/cacheService';
import HorizontalScroller from '../components/HorizontalScroller';
import MusicCard from '../components/MusicCard';

const { width } = Dimensions.get('window');

interface LaunchData {
  new_trending: any[];
  new_albums: any[];
  top_playlists: any[];
  charts: any[];
  artists: any[];
}

interface Section {
  title: string;
  data: any[];
  type: 'songs' | 'albums' | 'playlists' | 'artists';
}

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [launchData, setLaunchData] = useState<LaunchData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  const processLaunchData = useCallback((data: LaunchData): Section[] => {
    const processedSections: Section[] = [];

    if (data?.new_trending?.length > 0) {
      processedSections.push({
        title: 'Trending Now',
        data: data.new_trending.slice(0, 10),
        type: 'songs'
      });
    }

    if (data?.top_playlists?.length > 0) {
      processedSections.push({
        title: 'Popular Playlists',
        data: data.top_playlists.slice(0, 8),
        type: 'playlists'
      });
    }

    if (data?.new_albums?.length > 0) {
      processedSections.push({
        title: 'New Albums',
        data: data.new_albums.slice(0, 10),
        type: 'albums'
      });
    }

    if (data?.charts?.length > 0) {
      processedSections.push({
        title: 'Charts',
        data: data.charts.slice(0, 8),
        type: 'playlists'
      });
    }

    if (data?.artists?.length > 0) {
      processedSections.push({
        title: 'Top Artists',
        data: data.artists.slice(0, 8),
        type: 'artists'
      });
    }

    return processedSections;
  }, []);

  const loadData = useCallback(async (refresh: boolean = false) => {
    try {
      const cacheKey = 'home_screen_data';
      
      if (!refresh) {
        const cachedData = await cacheService.get<LaunchData>(cacheKey);
        if (cachedData) {
          setLaunchData(cachedData);
          setSections(processLaunchData(cachedData));
          setLoading(false);
          return;
        }
      }

      const data = await saavnApi.launch() as LaunchData;
      setLaunchData(data);
      setSections(processLaunchData(data));
      
      await cacheService.set(cacheKey, data);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [processLaunchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderSection = useCallback((section: Section) => {
    if (section.data.length === 0) return null;

    return (
      <View key={section.title} style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            {section.title}
          </Text>
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={theme.colors.primary}
            onPress={() => {}}
          />
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {section.data.map((item: any, index: number) => (
            <MusicCard
              key={`${section.type}-${index}`}
              item={item}
              type={section.type}
              onPress={() => {}}
            />
          ))}
        </ScrollView>
      </View>
    );
  }, [theme]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading music...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text variant="headlineMedium" style={[styles.greeting, { color: theme.colors.onBackground }]}>
            {getGreeting()}
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="search"
              size={24}
              iconColor={theme.colors.onBackground}
              onPress={() => {}}
            />
            <IconButton
              icon="settings"
              size={24}
              iconColor={theme.colors.onBackground}
              onPress={() => {}}
            />
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          {['All', 'Music', 'Podcasts', 'Live'].map((genre) => (
            <Chip
              key={genre}
              style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}
              textStyle={{ color: theme.colors.onSurfaceVariant }}
              onPress={() => {}}
            >
              {genre}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {launchData?.new_trending && launchData.new_trending.length > 0 && (
        <Surface style={[styles.featuredCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={styles.featuredContent}>
            <Text variant="titleLarge" style={[styles.featuredTitle, { color: theme.colors.onSurfaceVariant }]}>
              Trending Now 🔥
            </Text>
            <Text variant="bodyMedium" style={[styles.featuredSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Top tracks this week
            </Text>
            <Button
              mode="contained"
              onPress={() => {}}
              style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: theme.colors.onPrimary }}
            >
              Play All
            </Button>
          </View>
        </Surface>
      )}

      <View style={styles.sectionsContainer}>
        {sections.map(renderSection)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    padding: 16,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  chipsContainer: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  featuredCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredSubtitle: {
    marginBottom: 16,
    opacity: 0.8,
  },
  playButton: {
    alignSelf: 'flex-start',
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  horizontalList: {
    paddingRight: 16,
  },
});

export default HomeScreen;
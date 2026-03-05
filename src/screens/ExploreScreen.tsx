import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Alert,
  Pressable,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { saavnApi } from '../services/saavnApi';
import { useTheme } from '../contexts/ThemeContext';
import ScreenWrapper from '../components/ScreenWrapper';
import SkeletonLoader from '../components/SkeletonLoader';
import { useNavigation } from '@react-navigation/native';

const moods = ['Chill', 'Commute', 'Feel good', 'Party', 'Romance', 'Sad', 'Sleep', 'Workout'];
const moodImages: Record<string, string> = {
  Chill: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=320&q=60',
  Commute: 'https://picsum.photos/seed/commute-mood/320/320',
  'Feel good': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=320&q=60',
  Party: 'https://images.unsplash.com/photo-1496024840928-4c417adf211d?auto=format&fit=crop&w=320&q=60',
  Romance: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=320&q=60',
  Sad: 'https://picsum.photos/seed/sad-mood/320/320',
  Sleep: 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&w=320&q=60',
  Workout: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=320&q=60',
};
const genres = [
  'Bengali', 'Bhojpuri', 'Carnatic classical', 'Classical', 'Dance & electronic', 'Devotional', 'Family', 'Folk & acoustic', 'Ghazal/sufi', 'Gujarati', 'Haryanvi', 'Hindi', 'Hindustani classical', 'Hip-hop', 'Indian indie', 'Indian pop', 'Indie & alternative', 'J-Pop', 'Jazz', 'K-Pop', 'Kannada', 'Malayalam', 'Marathi', 'Metal', 'Monsoon', 'Pop', 'Punjabi', 'R&B & soul', 'Reggae & caribbean', 'Rock', 'Tamil', 'Telugu',
];
const genreImages: Record<string, string> = {
  Bengali: 'https://images.unsplash.com/photo-1461784121038-f088ca1e7714?auto=format&fit=crop&w=240&q=60',
  Bhojpuri: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=240&q=60',
  'Carnatic classical': 'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=240&q=60',
  Classical: 'https://picsum.photos/seed/classical-genre/240/240',
  'Dance & electronic': 'https://picsum.photos/seed/dance-electronic-genre/240/240',
  Devotional: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=240&q=60',
  Family: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=240&q=60',
  'Folk & acoustic': 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=240&q=60',
  'Ghazal/sufi': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=240&q=60',
  Gujarati: 'https://images.unsplash.com/photo-1477233534935-f5e6fe7c1159?auto=format&fit=crop&w=240&q=60',
  Haryanvi: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=240&q=60',
  Hindi: 'https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?auto=format&fit=crop&w=240&q=60',
  'Hindustani classical': 'https://picsum.photos/seed/hindustani-classical-genre/240/240',
  'Hip-hop': 'https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?auto=format&fit=crop&w=240&q=60',
  'Indian indie': 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=240&q=60',
  'Indian pop': 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=240&q=60',
  'Indie & alternative': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=240&q=60',
  'J-Pop': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=240&q=60',
  Jazz: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=240&q=60',
  'K-Pop': 'https://picsum.photos/seed/kpop-genre/240/240',
  Kannada: 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=240&q=60',
  Malayalam: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=240&q=60',
  Marathi: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=240&q=60',
  Metal: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=240&q=60',
  Monsoon: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=240&q=60',
  Pop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=240&q=60',
  Punjabi: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=240&q=60',
  'R&B & soul': 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=240&q=60',
  'Reggae & caribbean': 'https://images.unsplash.com/photo-1517232115160-ff93364542dd?auto=format&fit=crop&w=240&q=60',
  Rock: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=240&q=60',
  Tamil: 'https://images.unsplash.com/photo-1453090927415-5f45085b65c0?auto=format&fit=crop&w=240&q=60',
  Telugu: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=240&q=60',
};

type TileProps = {
  title: string;
  image?: string;
  onPress?: () => void;
  loading?: boolean;
  cardWidth: number;
};

function ExploreTile({ title, image, onPress, loading, cardWidth }: TileProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 9,
      tension: 180,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 160,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          width: cardWidth,
          transform: [{ scale }],
          shadowColor: '#000',
          backgroundColor: theme.colors.surfaceVariant,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        hitSlop={8}
        style={styles.pressable}
        android_ripple={{ color: theme.colors.onSurface + '1A' }}
        accessibilityRole="button"
        accessible
        accessibilityLabel={`Open ${title} playlists`}
        accessibilityHint="Shows a list of matching playlists"
      >
        <Image
          source={image ? { uri: image } : require('../../assets/icon.png')}
          style={styles.coverImage}
        />

        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.66)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientOverlay}
        />

        <View style={styles.textWrap}>
          <Text numberOfLines={2} style={[styles.genreTitle, { color: theme.colors.onPrimary }]}>
            {title}
          </Text>
        </View>

        {loading ? (
          <View style={styles.tileLoader}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function ExploreScreen() {
  const { theme } = useTheme();
  const nav = useNavigation();
  const { width } = useWindowDimensions();
  const [loadingTerm, setLoadingTerm] = useState<string | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);

  const { columns, cardWidth } = useMemo(() => {
    const horizontalPadding = 24;
    const gap = 12;
    const availableWidth = width - horizontalPadding;
    const minCardWidth = 156;
    const calcColumns = Math.max(2, Math.min(4, Math.floor((availableWidth + gap) / (minCardWidth + gap))));
    const calcCardWidth = Math.floor((availableWidth - gap * (calcColumns - 1)) / calcColumns);
    return { columns: calcColumns, cardWidth: calcCardWidth };
  }, [width]);

  useEffect(() => {
    let mounted = true;
    const urls = [...Object.values(moodImages), ...Object.values(genreImages)].filter(Boolean);

    const warmCache = async () => {
      try {
        await Promise.all(urls.slice(0, 20).map((uri) => Image.prefetch(uri)));
      } catch (e) {
        console.warn('image prefetch failed', e);
      } finally {
        if (mounted) setIsListLoading(false);
      }
    };

    warmCache();
    return () => {
      mounted = false;
    };
  }, []);

  const renderTile = (item: string) => (
    <ExploreTile
      key={item}
      title={item}
      image={moodImages[item] || genreImages[item]}
      loading={loadingTerm === item}
      cardWidth={cardWidth}
      onPress={async () => {
        try {
          setLoadingTerm(item);
          const list: any = await (saavnApi as any).searchPlaylists(item, 10);
          (nav as any).navigate('PlaylistResults', { title: item, data: list });
        } catch (e: any) {
          console.warn('playlist fetch failed', e);
          Alert.alert('Error', 'Failed to load playlists');
        } finally {
          setLoadingTerm(null);
        }
      }}
    />
  );

  const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );

  const moodRows = useMemo(() => chunk(moods, columns), [columns]);
  const genreRows = useMemo(() => chunk(genres, columns), [columns]);

  if (isListLoading) {
    return (
      <ScreenWrapper
        headerProps={{
          title: 'Explore',
          hideThemeToggle: true,
        }}
      >
        <View style={{ paddingHorizontal: theme.ui.spacing.lg }}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Moods</Text>
        </View>
        <View style={styles.skeletonWrap}>
          <SkeletonLoader type="grid" count={6} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Explore',
        hideThemeToggle: true,
      }}
    >
      <View style={{ paddingHorizontal: theme.ui.spacing.lg }}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Moods</Text>
      </View>
      <View style={styles.listTop}>
        {moodRows.map((row, i) => (
          <View key={i} style={[styles.column, { flexDirection: 'row' }]}>
            {row.map((item) => renderTile(item))}
            {Array.from({ length: columns - row.length }).map((_, k) => (
              <View key={`spacer-${k}`} style={{ width: cardWidth }} />
            ))}
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: theme.ui.spacing.lg, marginTop: theme.ui.spacing.md }}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Genres</Text>
      </View>
      <View style={styles.list}>
        {genreRows.map((row, i) => (
          <View key={i} style={[styles.column, { flexDirection: 'row' }]}>
            {row.map((item) => renderTile(item))}
            {Array.from({ length: columns - row.length }).map((_, k) => (
              <View key={`spacer-${k}`} style={{ width: cardWidth }} />
            ))}
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listTop: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 100,
    paddingTop: 8,
  },
  column: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  pressable: {
    height: 132,
    justifyContent: 'flex-end',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  textWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tileLoader: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  sectionTitle: {
    marginBottom: 2,
    fontSize: 20,
    fontWeight: '700',
  },
  skeletonWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});

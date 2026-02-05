import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Title, Card, Subheading } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { saavnApi } from '../services/saavnApi';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import OfflineBanner from '../components/OfflineBanner';
import { ActivityIndicator, Alert } from 'react-native'; // Added import for ActivityIndicator and Alert
import { useNavigation } from '@react-navigation/native';

const moods = ['Chill', 'Commute', 'Feel good', 'Party', 'Romance', 'Sad', 'Sleep', 'Workout'];
const genres = [
  'Bengali','Bhojpuri','Carnatic classical','Classical','Dance & electronic','Devotional','Family','Folk & acoustic','Ghazal/sufi','Gujarati','Haryanvi','Hindi','Hindustani classical','Hip-hop','Indian indie','Indian pop','Indie & alternative','J-Pop','Jazz','K-Pop','Kannada','Malayalam','Marathi','Metal','Monsoon','Pop','Punjabi','R&B & soul','Reggae & caribbean','Rock','Tamil','Telugu'
];

function GridTile({ title, onPress, loading }: { title: string; onPress?: () => void; loading?: boolean }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, styles.tileWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, borderWidth: 1 }]}
      onPress={onPress}
    >
      <View style={styles.tileTextWrap}>
        <Title numberOfLines={1} style={{ color: theme.colors.onSurface, fontSize: 16, paddingLeft: 6 }}>{title}</Title>
      </View>
      {loading ? <ActivityIndicator color={theme.colors.primary} style={{ marginLeft: 8 }} /> : null}
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const { theme } = useTheme();
  const nav = useNavigation();
  const [loadingTerm, setLoadingTerm] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Explore" />
      <OfflineBanner />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 12 }}>
          <Title style={styles.sectionTitle}>Moods & moments</Title>
        </View>
        <FlatList
          data={moods}
          keyExtractor={(i) => `mood-${i}`}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
          numColumns={2}
          renderItem={({ item }) => (
            <GridTile
              title={item}
              loading={loadingTerm === item}
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
          )}
        />

        <View style={{ paddingHorizontal: 12, marginTop: 8 }}>
          <Title style={styles.sectionTitle}>Genres</Title>
        </View>
        <FlatList
          data={genres}
          keyExtractor={(i) => `genre-${i}`}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
          numColumns={2}
          renderItem={({ item }) => (
            <GridTile
              title={item}
              loading={loadingTerm === item}
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
          )}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { flexBasis: '48%', marginVertical: 6, marginHorizontal: 6 },
  tileWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  tileTextWrap: { flex: 1 },
  cover: { height: 140 },
  sectionTitle: { fontSize: 20, marginBottom: 8 }
});

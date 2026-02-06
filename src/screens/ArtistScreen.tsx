import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Title, Card, Avatar } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { saavnApi } from '../services/saavnApi';
import { getBestImage, decodeHtmlEntities } from '../utils/normalize';
import { usePlayer } from '../contexts/PlayerContext';

interface ArtistScreenProps {}

const ArtistScreen: React.FC<ArtistScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { artist } = route.params as { artist: any };
  const { theme } = useTheme();
  const player = usePlayer();
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!artist) return;
        const resp: any = await saavnApi.searchSongs(artist.name || artist.title || '', 20);
        const data: any = (resp as any)?.data || resp;
        const songs = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (mounted) setTopSongs(songs.map((s: any) => ({ id: s.id || s.sid, title: decodeHtmlEntities(s.title || s.name), artist: s.subtitle || '', artwork: getBestImage(s.image || s.images) })));
      } catch (e) {
        console.warn('Artist top songs failed', e);
      }
    })();
    return () => { mounted = false; };
  }, [artist]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: theme.colors.surface }}>
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} onPress={() => (navigation as any).goBack()} />
        <Title style={{ color: theme.colors.onSurface, marginLeft: 12 }}>{artist?.name || 'Artist'}</Title>
      </View>

      <FlatList
        ListHeaderComponent={<View style={{ padding: 16, alignItems: 'center' }}>
          <Card style={{ width: 180, height: 180, borderRadius: 8, overflow: 'hidden' }}>
            <Card.Cover source={ artist?.image ? { uri: artist.image } : require('../../assets/soniq-logo.png') } style={{ width: 180, height: 180 }} />
          </Card>
          <Text style={{ marginTop: 12, color: theme.colors.onSurface }}>{artist?.bio || ''}</Text>
          <View style={{ width: '100%', marginTop: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Top Songs</Text>
            <FlatList horizontal data={topSongs} keyExtractor={(i) => i.id} renderItem={({ item }) => (
              <TouchableOpacity style={{ width: 140, marginRight: 12 }} onPress={async () => { await player.playSong(item); player.open(item); }}>
                <Card>
                  <Card.Cover source={ item.artwork ? { uri: item.artwork } : require('../../assets/soniq-logo.png') } style={{ height: 120 }} />
                  <Text style={{ padding: 6 }}>{item.title}</Text>
                </Card>
              </TouchableOpacity>
            )} />
          </View>
        </View>}
        data={albums}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 12 }} onPress={() => (navigation as any).navigate('Album', { album: item })}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Card.Cover source={ item.image ? { uri: item.image } : require('../../assets/soniq-logo.png') } style={{ width: 72, height: 72 }} />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontWeight: '700' }}>{item.title}</Text>
                <Text style={{ color: '#666' }}>{item.year || ''}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ArtistScreen;
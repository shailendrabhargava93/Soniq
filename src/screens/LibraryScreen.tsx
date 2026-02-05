import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, List, Card, IconButton, SegmentedButtons } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import PlaylistManager from '../components/PlaylistManager';

const LibraryScreen = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('playlists');

  const playlists = [
    { name: 'Liked Songs', count: 245, icon: 'heart' },
    { name: 'Road Trip', count: 32, icon: 'car' },
    { name: 'Workout', count: 28, icon: 'dumbbell' },
    { name: 'Study', count: 45, icon: 'book-open' },
  ];

  const recentAlbums = [
    { name: 'Album 1', artist: 'Artist 1' },
    { name: 'Album 2', artist: 'Artist 2' },
    { name: 'Album 3', artist: 'Artist 3' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
            Your Library
          </Text>
          <IconButton 
            icon="add" 
            size={24}
            onPress={() => {}}
          />
        </View>

        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'playlists', label: 'Playlists' },
            { value: 'albums', label: 'Albums' },
            { value: 'artists', label: 'Artists' },
          ]}
          style={{ marginBottom: 24 }}
        />
      </View>

      {activeTab === 'playlists' && <PlaylistManager />}
      
      {activeTab === 'albums' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground, marginBottom: 16 }}>
            Recent Albums
          </Text>

        <Text variant="titleLarge" style={{ color: theme.colors.onBackground, marginBottom: 16 }}>
          Playlists
        </Text>
        
        {playlists.map((playlist, index) => (
          <Card key={index} style={{ marginBottom: 8 }}>
            <List.Item
              title={playlist.name}
              description={`${playlist.count} songs`}
              left={(props) => <List.Icon {...props} icon={playlist.icon} />}
              right={(props) => <IconButton {...props} icon="chevron-right" onPress={() => {}} />}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card>
        ))}

        <Text variant="titleLarge" style={{ color: theme.colors.onBackground, marginTop: 24, marginBottom: 16 }}>
          Recent Albums
        </Text>
        
          {recentAlbums.map((album, index) => (
            <Card key={index} style={{ marginBottom: 8 }}>
              <List.Item
                title={album.name}
                description={album.artist}
                left={(props) => (
                  <View {...props} style={{ justifyContent: 'center', marginRight: 16 }}>
                    <Card style={{ width: 48, height: 48 }}>
                      <Card.Cover 
                        source={{ uri: `https://picsum.photos/seed/album${index}/48/48` }} 
                        style={{ width: 48, height: 48 }}
                      />
                    </Card>
                  </View>
                )}
                titleStyle={{ color: theme.colors.onSurface }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              />
            </Card>
          ))}
        </ScrollView>
      )}
      
      {activeTab === 'artists' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground, marginBottom: 16 }}>
            Favorite Artists
          </Text>
          {['Artist 1', 'Artist 2', 'Artist 3'].map((artist, index) => (
            <Card key={index} style={{ marginBottom: 8 }}>
              <List.Item
                title={artist}
                description={`${index + 10} songs`}
                left={(props) => (
                  <View {...props} style={{ justifyContent: 'center', marginRight: 16 }}>
                    <Card style={{ width: 48, height: 48, borderRadius: 24 }}>
                      <Card.Cover 
                        source={{ uri: `https://picsum.photos/seed/artist${index}/48/48` }} 
                        style={{ width: 48, height: 48, borderRadius: 24 }}
                      />
                    </Card>
                  </View>
                )}
                titleStyle={{ color: theme.colors.onSurface }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              />
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default LibraryScreen;
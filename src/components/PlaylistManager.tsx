import React, { useState } from 'react';
import { View, ScrollView, Modal } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, List, Portal } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

interface Playlist {
  id: string;
  name: string;
  description: string;
  songCount: number;
  cover: string;
}

const PlaylistManager: React.FC = () => {
  const { theme } = useTheme();
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: '1', name: 'My Favorites', description: 'All my favorite songs', songCount: 25, cover: 'https://picsum.photos/seed/playlist1/100/100' },
    { id: '2', name: 'Road Trip', description: 'Perfect songs for driving', songCount: 18, cover: 'https://picsum.photos/seed/playlist2/100/100' },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  const createPlaylist = () => {
    if (newPlaylistName.trim()) {
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name: newPlaylistName,
        description: newPlaylistDescription,
        songCount: 0,
        cover: `https://picsum.photos/seed/playlist${Date.now()}/100/100`
      };
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateModal(false);
    }
  };

  const deletePlaylist = (id: string) => {
    setPlaylists(playlists.filter(playlist => playlist.id !== id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
            Playlists
          </Text>
          <Button 
            mode="contained-tonal" 
            onPress={() => setShowCreateModal(true)}
            icon="plus"
          >
            Create
          </Button>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {playlists.map((playlist) => (
            <Card key={playlist.id} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', padding: 16 }}>
                <Card.Cover 
                  source={{ uri: playlist.cover }} 
                  style={{ width: 60, height: 60, borderRadius: 4 }}
                />
                <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    {playlist.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {playlist.description}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 4 }}>
                    {playlist.songCount} songs
                  </Text>
                </View>
                <IconButton
                  icon="more-vert"
                  onPress={() => {}}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>

      <Portal>
        {showCreateModal ? (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: theme.colors.surface,
              padding: 24,
              margin: 20,
              borderRadius: 12,
              width: '90%',
              maxWidth: 400,
            }}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginBottom: 20 }}>
                Create New Playlist
              </Text>
              
              <TextInput
                label="Playlist Name"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                mode="outlined"
                style={{ marginBottom: 16 }}
              />
              
              <TextInput
                label="Description (optional)"
                value={newPlaylistDescription}
                onChangeText={setNewPlaylistDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ marginBottom: 24 }}
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Button
                  mode="text"
                  onPress={() => setShowCreateModal(false)}
                  style={{ marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={createPlaylist}
                  disabled={!newPlaylistName.trim()}
                >
                  Create
                </Button>
              </View>
            </View>
          </View>
        ) : null}
      </Portal>
    </View>
  );
};

export default PlaylistManager;
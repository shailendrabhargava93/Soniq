import React from 'react';
import { View, Share } from 'react-native';
import { Portal, Modal, Divider, Text, Button, Drawer } from 'react-native-paper';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNavigation } from '@react-navigation/native';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  song: any;
  onPlayNow?: (song: any) => void;
  onAddToQueue?: (song: any) => void;
  onPlayNext?: (song: any) => void;
  onDownload?: (song: any) => void;
};

export default function SongContextMenu({ visible, onDismiss, song, onPlayNow, onAddToQueue, onPlayNext, onDownload }: Props) {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const nav = useNavigation();

  if (!song) return null;

  const handleShare = async () => {
    try {
      await Share.share({ message: `${song.title} — ${song.artist}\n${song.uri || ''}` });
    } catch (e) {
      // swallow
    }
    onDismiss();
  };

  const handleViewArtist = () => {
    onDismiss();
    // navigate to Artist screen
    try { (nav as any).navigate('Artist', { artist: { id: song.artistId, name: song.artist } }); } catch (e) {}
  };

  const toggleFav = () => {
    if (isFavorite(song.id)) removeFromFavorites(song.id);
    else addToFavorites(song);
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ margin: 0 }}>
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '72%', backgroundColor: 'white', paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>{song.title}</Text>
            <Text style={{ color: '#666', marginBottom: 8 }}>{song.artist}</Text>
          </View>
          <Divider />
          <Drawer.Section>
            <Drawer.Item label="Play Now" onPress={() => { onPlayNow?.(song); onDismiss(); }} />
            <Drawer.Item label="Play Next" onPress={() => { onPlayNext?.(song); onDismiss(); }} />
            <Drawer.Item label="Add to Queue" onPress={() => { onAddToQueue?.(song); onDismiss(); }} />
            <Divider />
            <Drawer.Item label={isFavorite(song.id) ? 'Remove from favourites' : 'Add to favourites'} onPress={toggleFav} />
            <Drawer.Item label="Share" onPress={handleShare} />
            <Drawer.Item label="View artist" onPress={handleViewArtist} />
            <Drawer.Item label="Download" onPress={() => { onDownload?.(song); onDismiss(); }} />
          </Drawer.Section>
          <Button onPress={onDismiss} compact>Close</Button>
        </View>
      </Modal>
    </Portal>
  );
}

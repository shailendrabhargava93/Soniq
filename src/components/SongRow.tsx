import React, { useState } from 'react';
import { View, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import SongItem from './SongItem';
import SongContextMenu from './SongContextMenu';
import { MaterialIcons } from '@expo/vector-icons';

export default function SongRow({
  song,
  onPress,
  onLongPress,
  showDragHandle = false,
  onPlayNow,
  onAddToQueue,
  onPlayNext,
}: {
  song: any;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: () => void;
  showDragHandle?: boolean;
  onPlayNow?: (s: any) => void;
  onAddToQueue?: (s: any) => void;
  onPlayNext?: (s: any) => void;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      <SongItem
        title={song.title}
        artist={song.artist}
        imageSrc={song.artwork || song.image}
        onPress={onPress}
        playing={song.playing}
        rightContent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showDragHandle ? <MaterialIcons name="drag-handle" size={20} color={theme.colors.onSurfaceVariant} style={{ marginRight: 8 }} /> : null}
            <IconButton icon={({ size, color }) => <MaterialIcons name="more-vert" size={size} color={color} />} onPress={() => setMenuVisible(true)} />
          </View>
        }
      />

      <SongContextMenu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        song={song}
        onPlayNow={onPlayNow}
        onAddToQueue={onAddToQueue}
        onPlayNext={onPlayNext}
        onDownload={() => { /* placeholder */ }}
      />
    </>
  );
}

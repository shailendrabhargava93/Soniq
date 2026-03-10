
import React, { memo, useCallback } from 'react';
import { View, Modal, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { usePlayer } from '../contexts/PlayerContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { Track } from '../types/api';

const UpNextRow = memo(function UpNextRow({
  item,
  onPlay,
  borderColor,
  titleColor,
  subtitleColor,
}: {
  item: Track;
  onPlay: (item: Track) => void;
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: borderColor }]}
      onPress={() => onPlay(item)}
      activeOpacity={0.8}
    >
      {item.artwork && (
        <Image source={{ uri: item.artwork }} style={styles.thumbnail} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, { color: titleColor }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.itemSubtitle, { color: subtitleColor }]} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default function UpNextDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const player = usePlayer();
  const { theme } = useTheme();

  const clearAll = () => {
    player.clearQueue();
    onClose();
  };

  const handlePlay = useCallback(
    async (item: Track) => {
      await player.playSong(item);
      onClose();
    },
    [player, onClose]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Track; index: number }) => (
      <UpNextRow
        item={item}
        onPlay={handlePlay}
        borderColor={theme.colors.surfaceVariant}
        titleColor={theme.colors.onSurface}
        subtitleColor={theme.colors.onSurfaceVariant}
      />
    ),
    [handlePlay, theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.surfaceVariant]
  );

  const getItemLayout = useCallback((_: ArrayLike<Track> | null | undefined, index: number) => ({
    length: 73,
    offset: 73 * index,
    index,
  }), []);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent hardwareAccelerated statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          {/* Drag handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.surfaceVariant }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Up Next ({player.queue.length})
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {player.queue.length > 0 && (
                <TouchableOpacity onPress={clearAll} style={{ marginRight: 16 }}>
                  <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={player.queue}
            keyExtractor={(i, idx) => `${i.id}-${idx}`}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews
            ListEmptyComponent={
              <View style={{ padding: 24, alignItems: 'center' }}>
                <MaterialIcons name="queue-music" size={48} color={theme.colors.surfaceVariant} />
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Queue is empty
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  sheet: { 
    height: '70%', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    paddingBottom: 12 
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  itemTitle: { 
    fontWeight: '600',
    fontSize: 15,
  },
  itemSubtitle: { 
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
  },
});
